from django.contrib import admin
from .models import (
    Account,
    AccountContact,
    AccountBank,
    AccountTax,
    AccountOpeningBalance,
    SubAccount,
    ACGroup,
    ACGroupMaster,
)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "account_no",
        "account_name",
        "group_code",
        "company",
        "branch",
        "status",
        "created_at",
    )
    list_filter = ("group_code", "status", "company", "branch")
    search_fields = ("account_no", "account_name")
    readonly_fields = ("created_at", "updated_at")


class AccountContactInline(admin.TabularInline):
    model = AccountContact
    fields = (
        "address_line",
        "city",
        "state",
        "country",
        "pin_code",
        "phone",
        "email",
    )


class AccountBankInline(admin.TabularInline):
    model = AccountBank
    fields = ("bank_name", "ifsc", "account_number")


class AccountTaxInline(admin.TabularInline):
    model = AccountTax
    fields = ("gstin", "pan")


class AccountOpeningBalanceInline(admin.TabularInline):
    model = AccountOpeningBalance
    fields = (
        "amount",
        "amount_drcr",
    )


class SubAccountInline(admin.TabularInline):
    model = SubAccount
    fields = (
        "sub_account_name",
        "phone_number",
        "email",
        "gender",
    )
    extra = 0


class AccountAdminWithInlines(admin.ModelAdmin):
    list_display = (
        "id",
        "account_no",
        "account_name",
        "group_code",
        "company",
        "branch",
        "status",
        "created_at",
    )
    list_filter = ("group_code", "status", "company", "branch")
    search_fields = ("account_no", "account_name")
    readonly_fields = ("created_at", "updated_at")
    inlines = [
        AccountContactInline,
        AccountBankInline,
        AccountTaxInline,
        AccountOpeningBalanceInline,
        SubAccountInline,
    ]


# Unregister the simple AccountAdmin and register the one with inlines
admin.site.unregister(Account)
admin.site.register(Account, AccountAdminWithInlines)


@admin.register(SubAccount)
class SubAccountAdmin(admin.ModelAdmin):
    """Admin for Sub Accounts: appears under the Accounts app section."""

    list_display = (
        "get_account_name",
        "sub_account_name",
        "phone_number",
        "email",
        "gender",
        "created_at",
    )
    list_select_related = ("account",)
    list_filter = ("gender",)
    search_fields = ("sub_account_name", "phone_number", "email", "account__account_name")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)

    def get_account_name(self, obj):
        return obj.account.account_name if obj.account else None

    get_account_name.short_description = "Account Name"
    get_account_name.admin_order_field = "account__account_name"


@admin.register(ACGroupMaster)
class ACGroupMasterAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(ACGroup)
class ACGroupAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_ac_group_name",
        "incl_in_sale",
        "incl_in_pur",
        "incl_in_out",
        "incl_in_ir",
        "address_req",
        "restrict_credit_facility",
        "created_at",
    )
    list_select_related = ("ac_group",)
    list_filter = (
        "incl_in_sale",
        "incl_in_pur",
        "incl_in_out",
        "incl_in_ir",
        "address_req",
        "restrict_credit_facility",
    )
    search_fields = ("ac_group__name",)
    readonly_fields = ("created_at", "updated_at")

    def get_ac_group_name(self, obj):
        return obj.ac_group.name if obj.ac_group else None

    get_ac_group_name.short_description = "A/C Group"
    get_ac_group_name.admin_order_field = "ac_group__name"
