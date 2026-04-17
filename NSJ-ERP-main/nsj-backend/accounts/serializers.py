"""Serializers for account management APIs."""

from __future__ import annotations

from typing import Any, Dict, Optional

from django.db import transaction
from rest_framework import serializers

from .models import (
    Account,
    AccountBank,
    AccountContact,
    AccountOpeningBalance,
    AccountTax,
)

from .models import ACGroup, ACGroupMaster
from .models import SubAccount


class ACGroupMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ACGroupMaster
        fields = [
            "id",
            "name",
            "tally_parent_group",
            "financial_statement",
            "universal_nature",
            "normal_balance",
            "use_in_spark",
            "ledger_examples",
            "export_rule",
            "status",
        ]


class ACGroupSerializer(serializers.ModelSerializer):
    ac_group = ACGroupMasterSerializer(read_only=True)
    ac_group_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = ACGroup
        fields = [
            "id",
            "ac_group",
            "ac_group_id",
            "name",
            "tally_parent_group",
            "financial_statement",
            "universal_nature",
            "normal_balance",
            "status",
            "incl_in_sale",
            "incl_in_pur",
            "incl_in_out",
            "incl_in_ir",
            "address_req",
            "restrict_credit_facility",
            "ledger_examples",
            "export_rule",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def create(self, validated_data: Dict[str, Any]):
        ac_group_id = validated_data.pop("ac_group_id", None)
        if ac_group_id:
            try:
                # Get the master record and copy its values
                from .models import ACGroupMaster
                master = ACGroupMaster.objects.get(id=ac_group_id)
                validated_data["ac_group_id"] = ac_group_id
                # Copy values from master if not provided
                validated_data.setdefault("name", master.name)
                validated_data.setdefault("tally_parent_group", master.tally_parent_group)
                validated_data.setdefault("financial_statement", master.financial_statement)
                validated_data.setdefault("universal_nature", master.universal_nature)
                validated_data.setdefault("normal_balance", master.normal_balance)
                validated_data.setdefault("status", master.status)
                validated_data.setdefault("ledger_examples", master.ledger_examples)
                validated_data.setdefault("export_rule", master.export_rule)
            except ACGroupMaster.DoesNotExist:
                pass
        return super().create(validated_data)

    def update(self, instance, validated_data: Dict[str, Any]):
        ac_group_id = validated_data.pop("ac_group_id", None)
        if ac_group_id is not None:
            validated_data["ac_group_id"] = ac_group_id
        return super().update(instance, validated_data)


class AccountContactSerializer(serializers.ModelSerializer):
    country_master_id = serializers.CharField(
        write_only=True, required=False, allow_null=True, allow_blank=True
    )
    state = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    city = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = AccountContact
        exclude = ["account", "country_master", "state_master", "city_master"]


class AccountBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountBank
        exclude = ["account"]


class AccountTaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountTax
        fields = ["gstin", "pan"]


class AccountOpeningBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountOpeningBalance
        exclude = ["account"]


class AccountSerializer(serializers.ModelSerializer):
    contact = AccountContactSerializer(required=False, allow_null=True)
    bank = AccountBankSerializer(required=False, allow_null=True)
    tax = AccountTaxSerializer(required=False, allow_null=True)
    opening_balance = AccountOpeningBalanceSerializer(required=False, allow_null=True)
    
    # Include spark_account_group details
    spark_account_group = ACGroupMasterSerializer(read_only=True)
    spark_account_group_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "company",
            "account_no",
            "account_name",
            "ledger_role",
            "group_code",
            "spark_account_group",
            "spark_account_group_id",
            "tally_parent_group",
            "financial_statement",
            "normal_balance",
            "party_category",
            "gst_registration_type",
            "bill_wise_required",
            "cost_centre_required",
            "export_to_tally",
            "status",
            "tally_ledger_name_override",
            "team_notice",
            "validation_status",
            "remarks",
            "created_by",
            "created_at",
            "updated_at",
            "contact",
            "bank",
            "tax",
            "opening_balance",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "company", "created_by", "account_no", "group_code"]

    def validate(self, data):
        """Handle spark_account_group_id and populate derived fields"""
        spark_account_group_id = data.pop('spark_account_group_id', None)
        if spark_account_group_id:
            try:
                from .models import ACGroupMaster
                master = ACGroupMaster.objects.get(id=spark_account_group_id)
                data['spark_account_group'] = master
                # Derived fields will be set in model's save() method
            except ACGroupMaster.DoesNotExist:
                raise serializers.ValidationError(
                    {"spark_account_group_id": "Invalid ACGroupMaster ID"}
                )
        return data

    def _generate_account_no(self, company) -> str:
        """Generate next account number for the company"""
        if not company:
            return "1"

        # Get the highest numeric account number for this company
        from django.db.models import Max
        from django.db.models.functions import Cast
        from django.db.models import IntegerField

        try:
            # Try to get the maximum account_no as integer
            max_account = Account.objects.filter(company=company).aggregate(
                max_no=Max(Cast("account_no", IntegerField()))
            )["max_no"]

            if max_account is None:
                return "1"
            else:
                return str(max_account + 1)

        except Exception:
            # Fallback: count total accounts and add 1
            count = Account.objects.filter(company=company).count()
            return str(count + 1)

    def _pop_nested(self, data: Dict[str, Any], key: str) -> Optional[Dict[str, Any]]:
        nested = data.pop(key, None)
        if nested is None:
            return None
        if not any(value is not None for value in nested.values()):
            return None
        return nested

    def create(self, validated_data: Dict[str, Any]) -> Account:
        contact_data = self._pop_nested(validated_data, "contact")
        bank_data = self._pop_nested(validated_data, "bank")
        tax_data = self._pop_nested(validated_data, "tax")
        opening_data = self._pop_nested(validated_data, "opening_balance")

        # Auto-generate account number
        company = validated_data.get("company")
        validated_data["account_no"] = self._generate_account_no(company)

        with transaction.atomic():
            account = Account.objects.create(**validated_data)
            self._upsert_related(AccountContact, account, contact_data)
            self._upsert_related(AccountBank, account, bank_data)
            self._upsert_related(AccountTax, account, tax_data)
            self._upsert_related(AccountOpeningBalance, account, opening_data)

        return account

    def update(self, instance: Account, validated_data: Dict[str, Any]) -> Account:
        contact_data = self._pop_nested(validated_data, "contact")
        bank_data = self._pop_nested(validated_data, "bank")
        tax_data = self._pop_nested(validated_data, "tax")
        opening_data = self._pop_nested(validated_data, "opening_balance")

        validated_data.pop("company", None)
        validated_data.pop("created_by", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        with transaction.atomic():
            instance.save()
            self._upsert_related(AccountContact, instance, contact_data)
            self._upsert_related(AccountBank, instance, bank_data)
            self._upsert_related(AccountTax, instance, tax_data)
            self._upsert_related(AccountOpeningBalance, instance, opening_data)

        return instance

    def _upsert_related(
        self,
        model_cls: Any,
        account: Account,
        data: Optional[Dict[str, Any]],
    ) -> None:
        if data is None:
            return

        if model_cls == AccountContact:
            # Convert country_master_id to country name (text field)
            if "country_master_id" in data:
                country_id = data.pop("country_master_id")
                if country_id:
                    hardcoded_countries = [
                        {"id": "1", "name": "Afghanistan"},
                        {"id": "2", "name": "Albania"},
                        {"id": "3", "name": "Algeria"},
                        {"id": "4", "name": "Andorra"},
                        {"id": "5", "name": "Angola"},
                        {"id": "6", "name": "Antigua and Barbuda"},
                        {"id": "7", "name": "Argentina"},
                        {"id": "8", "name": "Armenia"},
                        {"id": "9", "name": "Australia"},
                        {"id": "10", "name": "Austria"},
                        {"id": "11", "name": "Azerbaijan"},
                        {"id": "12", "name": "Bahamas"},
                        {"id": "13", "name": "Bahrain"},
                        {"id": "14", "name": "Bangladesh"},
                        {"id": "15", "name": "Barbados"},
                        {"id": "16", "name": "Belarus"},
                        {"id": "17", "name": "Belgium"},
                        {"id": "18", "name": "Belize"},
                        {"id": "19", "name": "Benin"},
                        {"id": "20", "name": "Bhutan"},
                        {"id": "21", "name": "Bolivia"},
                        {"id": "22", "name": "Bosnia and Herzegovina"},
                        {"id": "23", "name": "Botswana"},
                        {"id": "24", "name": "Brazil"},
                        {"id": "25", "name": "Brunei"},
                        {"id": "26", "name": "Bulgaria"},
                        {"id": "27", "name": "Burkina Faso"},
                        {"id": "28", "name": "Burundi"},
                        {"id": "29", "name": "Cabo Verde"},
                        {"id": "30", "name": "Cambodia"},
                        {"id": "31", "name": "Cameroon"},
                        {"id": "32", "name": "Canada"},
                        {"id": "33", "name": "Central African Republic"},
                        {"id": "34", "name": "Chad"},
                        {"id": "35", "name": "Chile"},
                        {"id": "36", "name": "China"},
                        {"id": "37", "name": "Colombia"},
                        {"id": "38", "name": "Comoros"},
                        {"id": "39", "name": "Congo"},
                        {"id": "40", "name": "Costa Rica"},
                        {"id": "41", "name": "Croatia"},
                        {"id": "42", "name": "Cuba"},
                        {"id": "43", "name": "Cyprus"},
                        {"id": "44", "name": "Czech Republic"},
                        {"id": "45", "name": "Democratic Republic of the Congo"},
                        {"id": "46", "name": "Denmark"},
                        {"id": "47", "name": "Djibouti"},
                        {"id": "48", "name": "Dominica"},
                        {"id": "49", "name": "Dominican Republic"},
                        {"id": "50", "name": "Ecuador"},
                        {"id": "51", "name": "Egypt"},
                        {"id": "52", "name": "El Salvador"},
                        {"id": "53", "name": "Equatorial Guinea"},
                        {"id": "54", "name": "Eritrea"},
                        {"id": "55", "name": "Estonia"},
                        {"id": "56", "name": "Eswatini"},
                        {"id": "57", "name": "Ethiopia"},
                        {"id": "58", "name": "Fiji"},
                        {"id": "59", "name": "Finland"},
                        {"id": "60", "name": "France"},
                        {"id": "61", "name": "Gabon"},
                        {"id": "62", "name": "Gambia"},
                        {"id": "63", "name": "Georgia"},
                        {"id": "64", "name": "Germany"},
                        {"id": "65", "name": "Ghana"},
                        {"id": "66", "name": "Greece"},
                        {"id": "67", "name": "Grenada"},
                        {"id": "68", "name": "Guatemala"},
                        {"id": "69", "name": "Guinea"},
                        {"id": "70", "name": "Guinea-Bissau"},
                        {"id": "71", "name": "Guyana"},
                        {"id": "72", "name": "Haiti"},
                        {"id": "73", "name": "Honduras"},
                        {"id": "74", "name": "Hungary"},
                        {"id": "75", "name": "Iceland"},
                        {"id": "76", "name": "India"},
                        {"id": "77", "name": "Indonesia"},
                        {"id": "78", "name": "Iran"},
                        {"id": "79", "name": "Iraq"},
                        {"id": "80", "name": "Ireland"},
                        {"id": "81", "name": "Israel"},
                        {"id": "82", "name": "Italy"},
                        {"id": "83", "name": "Ivory Coast"},
                        {"id": "84", "name": "Jamaica"},
                        {"id": "85", "name": "Japan"},
                        {"id": "86", "name": "Jordan"},
                        {"id": "87", "name": "Kazakhstan"},
                        {"id": "88", "name": "Kenya"},
                        {"id": "89", "name": "Kiribati"},
                        {"id": "90", "name": "Kuwait"},
                        {"id": "91", "name": "Kyrgyzstan"},
                        {"id": "92", "name": "Laos"},
                        {"id": "93", "name": "Latvia"},
                        {"id": "94", "name": "Lebanon"},
                        {"id": "95", "name": "Lesotho"},
                        {"id": "96", "name": "Liberia"},
                        {"id": "97", "name": "Libya"},
                        {"id": "98", "name": "Liechtenstein"},
                        {"id": "99", "name": "Lithuania"},
                        {"id": "100", "name": "Luxembourg"},
                        {"id": "101", "name": "Madagascar"},
                        {"id": "102", "name": "Malawi"},
                        {"id": "103", "name": "Malaysia"},
                        {"id": "104", "name": "Maldives"},
                        {"id": "105", "name": "Mali"},
                        {"id": "106", "name": "Malta"},
                        {"id": "107", "name": "Marshall Islands"},
                        {"id": "108", "name": "Mauritania"},
                        {"id": "109", "name": "Mauritius"},
                        {"id": "110", "name": "Mexico"},
                        {"id": "111", "name": "Micronesia"},
                        {"id": "112", "name": "Moldova"},
                        {"id": "113", "name": "Monaco"},
                        {"id": "114", "name": "Mongolia"},
                        {"id": "115", "name": "Montenegro"},
                        {"id": "116", "name": "Morocco"},
                        {"id": "117", "name": "Mozambique"},
                        {"id": "118", "name": "Myanmar"},
                        {"id": "119", "name": "Namibia"},
                        {"id": "120", "name": "Nauru"},
                        {"id": "121", "name": "Nepal"},
                        {"id": "122", "name": "Netherlands"},
                        {"id": "123", "name": "New Zealand"},
                        {"id": "124", "name": "Nicaragua"},
                        {"id": "125", "name": "Niger"},
                        {"id": "126", "name": "Nigeria"},
                        {"id": "127", "name": "North Korea"},
                        {"id": "128", "name": "North Macedonia"},
                        {"id": "129", "name": "Norway"},
                        {"id": "130", "name": "Oman"},
                        {"id": "131", "name": "Pakistan"},
                        {"id": "132", "name": "Palau"},
                        {"id": "133", "name": "Palestine"},
                        {"id": "134", "name": "Panama"},
                        {"id": "135", "name": "Papua New Guinea"},
                        {"id": "136", "name": "Paraguay"},
                        {"id": "137", "name": "Peru"},
                        {"id": "138", "name": "Philippines"},
                        {"id": "139", "name": "Poland"},
                        {"id": "140", "name": "Portugal"},
                        {"id": "141", "name": "Qatar"},
                        {"id": "142", "name": "Romania"},
                        {"id": "143", "name": "Russia"},
                        {"id": "144", "name": "Rwanda"},
                        {"id": "145", "name": "Saint Kitts and Nevis"},
                        {"id": "146", "name": "Saint Lucia"},
                        {"id": "147", "name": "Saint Vincent and the Grenadines"},
                        {"id": "148", "name": "Samoa"},
                        {"id": "149", "name": "San Marino"},
                        {"id": "150", "name": "Sao Tome and Principe"},
                        {"id": "151", "name": "Saudi Arabia"},
                        {"id": "152", "name": "Senegal"},
                        {"id": "153", "name": "Serbia"},
                        {"id": "154", "name": "Seychelles"},
                        {"id": "155", "name": "Sierra Leone"},
                        {"id": "156", "name": "Singapore"},
                        {"id": "157", "name": "Slovakia"},
                        {"id": "158", "name": "Slovenia"},
                        {"id": "159", "name": "Solomon Islands"},
                        {"id": "160", "name": "Somalia"},
                        {"id": "161", "name": "South Africa"},
                        {"id": "162", "name": "South Korea"},
                        {"id": "163", "name": "South Sudan"},
                        {"id": "164", "name": "Spain"},
                        {"id": "165", "name": "Sri Lanka"},
                        {"id": "166", "name": "Sudan"},
                        {"id": "167", "name": "Suriname"},
                        {"id": "168", "name": "Sweden"},
                        {"id": "169", "name": "Switzerland"},
                        {"id": "170", "name": "Syria"},
                        {"id": "171", "name": "Taiwan"},
                        {"id": "172", "name": "Tajikistan"},
                        {"id": "173", "name": "Tanzania"},
                        {"id": "174", "name": "Thailand"},
                        {"id": "175", "name": "Timor-Leste"},
                        {"id": "176", "name": "Togo"},
                        {"id": "177", "name": "Tonga"},
                        {"id": "178", "name": "Trinidad and Tobago"},
                        {"id": "179", "name": "Tunisia"},
                        {"id": "180", "name": "Turkey"},
                        {"id": "181", "name": "Turkmenistan"},
                        {"id": "182", "name": "Tuvalu"},
                        {"id": "183", "name": "Uganda"},
                        {"id": "184", "name": "Ukraine"},
                        {"id": "185", "name": "United Arab Emirates"},
                        {"id": "186", "name": "United Kingdom"},
                        {"id": "187", "name": "United States"},
                        {"id": "188", "name": "Uruguay"},
                        {"id": "189", "name": "Uzbekistan"},
                        {"id": "190", "name": "Vanuatu"},
                        {"id": "191", "name": "Vatican City"},
                        {"id": "192", "name": "Venezuela"},
                        {"id": "193", "name": "Vietnam"},
                        {"id": "194", "name": "Yemen"},
                        {"id": "195", "name": "Zambia"},
                        {"id": "196", "name": "Zimbabwe"},
                    ]

                    # Find country name by ID
                    for country in hardcoded_countries:
                        if country["id"] == str(country_id):
                            data["country"] = country["name"]
                            break
                else:
                    data["country"] = None

        model_cls.objects.update_or_create(account=account, defaults=data)


class SubAccountSerializer(serializers.ModelSerializer):
    # Return account id on write, and a small nested object on read
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all(), required=True)
    account_detail = serializers.SerializerMethodField(read_only=True)
    linked_orders = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SubAccount
        fields = [
            "id",
            "account",
            "account_detail",
            "sub_account_name",
            "phone_number",
            "email",
            "address",
            "gender",
            "linked_orders",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "account_detail",
            "linked_orders",
        ]

    def create(self, validated_data: Dict[str, Any]):
        return super().create(validated_data)

    def update(self, instance, validated_data: Dict[str, Any]):
        return super().update(instance, validated_data)

    def get_account_detail(self, obj):
        try:
            return {"id": str(obj.account_id), "name": getattr(obj.account, "account_name", None)}
        except Exception:
            return {"id": str(obj.account_id), "name": None}

    def get_linked_orders(self, obj):
        """Return summary of linked orders"""
        try:
            from vouchers.models import Order, PaymentEntry, JournalEntry

            orders = Order.objects.filter(sub_account=obj).values(
                "id", "bill_no", "job_no", "date", "item_name"
            )[:10]
            payments = PaymentEntry.objects.filter(sub_account=obj).values(
                "id", "date", "narration"
            )[:10]
            journals = JournalEntry.objects.filter(sub_account=obj).values(
                "id", "date", "narration"
            )[:10]

            return {
                "orders": list(orders),
                "payments": list(payments),
                "journals": list(journals),
                "orders_count": Order.objects.filter(sub_account=obj).count(),
                "payments_count": PaymentEntry.objects.filter(sub_account=obj).count(),
                "journals_count": JournalEntry.objects.filter(sub_account=obj).count(),
            }
        except Exception:
            return {
                "orders": [],
                "payments": [],
                "journals": [],
                "orders_count": 0,
                "payments_count": 0,
                "journals_count": 0,
            }
