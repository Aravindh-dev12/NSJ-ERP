from django.http import JsonResponse, HttpResponseBadRequest
from django.core.paginator import Paginator
from django.apps import apps
from django.views.decorators.http import require_GET
from django.db.models import Q
from django.db.models.fields.files import FieldFile
from decimal import Decimal
import uuid


def _model_has_account_field(model):
    for f in model._meta.get_fields():
        if getattr(f, "name", None) == "account":
            return True
    return False


def _values_for_instance(instance):
    # convert model instance to dict while serializing datetimes, files, decimals, uuids
    data = {}
    for field in instance._meta.get_fields():
        name = getattr(field, "name", None)
        if not name:
            continue
        # Skip reverse relations
        if field.is_relation and getattr(field, "one_to_many", False):
            continue
        try:
            val = getattr(instance, name)
        except AttributeError:
            continue

        # for foreign keys include the _id value and, when possible,
        # a small object with id+name to make frontend display easier
        if field.is_relation and getattr(field, "many_to_one", False):
            fk_id = getattr(instance, f"{name}_id", None)
            data[f"{name}_id"] = fk_id
            # attempt to include related object's human-readable name
            try:
                related = getattr(instance, name, None)
                if related is not None:
                    related_name = None
                    # common candidate attribute names for a display name
                    for candidate in (
                        "name",
                        "account_name",
                        "sub_account_name",
                        "full_name",
                        "display_name",
                        "title",
                        "party_name",
                    ):
                        if hasattr(related, candidate):
                            related_name = getattr(related, candidate)
                            break
                    related_id = getattr(related, "pk", None)
                    if related_id is None:
                        related_id = fk_id
                    if related_name is not None:
                        data[name] = {
                            "id": str(related_id) if related_id is not None else None,
                            "name": related_name,
                        }
                    else:
                        # fallback to returning the related object's PK as string
                        try:
                            data[name] = {"id": str(related_id) if related_id is not None else None}
                        except Exception:
                            data[name] = None
            except Exception:
                # ignore any errors while introspecting related object
                pass
            continue

        # For many-to-many fields, provide a list of small objects {id, name}
        if field.is_relation and getattr(field, "many_to_many", False):
            try:
                related_qs = getattr(instance, name).all()
                items = []
                for r in related_qs:
                    try:
                        r_name = None
                        for candidate in (
                            "name",
                            "account_name",
                            "sub_account_name",
                            "full_name",
                            "display_name",
                            "title",
                            "party_name",
                        ):
                            if hasattr(r, candidate):
                                r_name = getattr(r, candidate)
                                break
                        items.append({"id": str(getattr(r, "pk", None)), "name": r_name})
                    except Exception:
                        items.append({"id": str(getattr(r, "pk", None))})
                data[name] = items
            except Exception:
                data[name] = None
            continue

        # For certain non-relation fields that store FK ids as plain values
        # (for example account_id stored in a CharField), try to resolve
        # a small related object for better frontend display.
        try:
            name_l = name.lower() if isinstance(name, str) else ""
        except Exception:
            name_l = ""

        # attempt enrichment for id-like non-relation fields
        if (not field.is_relation) and any(
            k in name_l for k in ("account", "party", "sub_account", "subaccount")
        ):
            try:
                # value looks like a UUID or a non-empty string id
                if isinstance(val, (str,)) and val:
                    # try common account/subaccount models in the 'accounts' app
                    try:
                        AccountModel = apps.get_model("accounts", "Account")
                    except Exception:
                        AccountModel = None
                    try:
                        SubAccountModel = apps.get_model("accounts", "SubAccount")
                    except Exception:
                        SubAccountModel = None

                    # helper to fetch and build small object
                    def _fetch_small(model):
                        try:
                            if not model:
                                return None
                            obj = model.objects.filter(pk=val).first()
                            if not obj:
                                return None
                            for candidate in (
                                "name",
                                "account_name",
                                "sub_account_name",
                                "full_name",
                                "display_name",
                                "title",
                                "party_name",
                            ):
                                if hasattr(obj, candidate):
                                    return {
                                        "id": str(getattr(obj, "pk", None)),
                                        "name": getattr(obj, candidate),
                                    }
                            return {"id": str(getattr(obj, "pk", None))}
                        except Exception:
                            return None

                    detail = _fetch_small(SubAccountModel) or _fetch_small(AccountModel)
                    if detail is not None:
                        data[f"{name}_detail"] = detail
            except Exception:
                pass

        # Serialize common non-JSON types safely
        try:
            if val is None:
                data[name] = None
            elif isinstance(val, FieldFile):
                # return a URL if available, otherwise the filename
                try:
                    data[name] = (
                        val.url
                        if getattr(val, "name", None) and hasattr(val, "url")
                        else (val.name or None)
                    )
                except Exception:
                    data[name] = str(val)
            elif isinstance(val, Decimal):
                data[name] = str(val)
            elif isinstance(val, uuid.UUID):
                data[name] = str(val)
            elif hasattr(val, "isoformat"):
                try:
                    data[name] = val.isoformat()
                except Exception:
                    data[name] = str(val)
            elif hasattr(val, "pk") and not isinstance(val, (str, bytes)):
                # likely a related model instance; return a small presentation
                try:
                    related = val
                    related_name = None
                    for candidate in (
                        "name",
                        "account_name",
                        "sub_account_name",
                        "full_name",
                        "display_name",
                        "title",
                        "party_name",
                    ):
                        if hasattr(related, candidate):
                            related_name = getattr(related, candidate)
                            break
                    related_id = getattr(related, "pk", None)
                    if related_name is not None:
                        data[name] = {
                            "id": str(related_id) if related_id is not None else None,
                            "name": related_name,
                        }
                    else:
                        data[name] = str(related_id) if related_id is not None else str(related)
                except Exception:
                    data[name] = str(val)
            else:
                data[name] = val
        except Exception:
            # fallback to string representation to avoid serialization errors
            data[name] = str(val)

    return data


@require_GET
def account_report(request):
    """Aggregated account report endpoint.

    Query params:
      - account_id (required)
      - page (optional)
      - page_size (optional)
      - q (optional) search string
      - ordering (optional) e.g. created_at or -created_at
    """
    account_id = request.GET.get("account_id")
    if not account_id:
        return HttpResponseBadRequest("account_id is required")

    page = int(request.GET.get("page") or 1)
    page_size = int(request.GET.get("page_size") or 10)
    q = request.GET.get("q", "").strip()
    ordering = request.GET.get("ordering", "-created_at")

    results = []

    # Inspect apps for models that have any relation fields and filter them
    # by any FK or M2M that points to the selected account_id. This finds
    # records that directly reference the account via different field names
    # (account, party, beneficiary, etc.). We dedupe by model+pk.
    seen = set()
    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            # collect candidate relation lookups for this model
            candidate_lookups = []
            for field in model._meta.get_fields():
                # skip reverse relations
                if getattr(field, "one_to_many", False):
                    continue
                if field.is_relation:
                    if getattr(field, "many_to_one", False) or getattr(field, "one_to_one", False):
                        candidate_lookups.append(f"{field.name}_id")
                    elif getattr(field, "many_to_many", False):
                        candidate_lookups.append(f"{field.name}__id")

            if not candidate_lookups:
                continue

            # Build OR query across all candidate lookups
            filter_q = Q()
            for lookup in candidate_lookups:
                try:
                    filter_q |= Q(**{lookup: account_id})
                except Exception:
                    # skip lookups that aren't valid for the model
                    continue

            if not filter_q:
                continue

            # Execute the queryset
            try:
                qs = model.objects.filter(filter_q)
            except Exception:
                continue

            # If a search query was provided, attempt to filter on textual fields
            if q:
                text_q = Q()
                for field in model._meta.get_fields():
                    if getattr(field, "get_internal_type", lambda: "")().lower() in (
                        "charfield",
                        "textfield",
                    ):
                        try:
                            text_q |= Q(**{f"{field.name}__icontains": q})
                        except Exception:
                            continue
                if text_q:
                    qs = qs.filter(text_q)

            # Collect results while deduping
            for inst in qs:
                key = (model.__name__, str(getattr(inst, "pk", "")))
                if key in seen:
                    continue
                seen.add(key)
                item = _values_for_instance(inst)
                item["module_name"] = model.__name__
                # ensure created_at exists as isoformat string if possible
                created = item.get("created_at")
                if created and not isinstance(created, str):
                    try:
                        item["created_at"] = created.isoformat()
                    except Exception:
                        item["created_at"] = str(created)
                results.append(item)

    # Sort results by ordering (supports - prefix)
    reverse = False
    key = ordering
    if ordering.startswith("-"):
        reverse = True
        key = ordering[1:]

    def _sort_key(x):
        v = x.get(key)
        return v or ""

    results.sort(key=_sort_key, reverse=reverse)

    # Pagination
    paginator = Paginator(results, page_size)
    page_obj = paginator.get_page(page)

    # Build next/previous urls (simple, relative)
    base_qs = request.GET.copy()

    def _url_for(p):
        if p is None:
            return None
        base_qs["page"] = p
        return request.path + "?" + base_qs.urlencode()

    response = {
        "count": paginator.count,
        "next": _url_for(page_obj.next_page_number() if page_obj.has_next() else None),
        "previous": _url_for(page_obj.previous_page_number() if page_obj.has_previous() else None),
        "results": list(page_obj.object_list),
    }

    return JsonResponse(response, safe=True)
