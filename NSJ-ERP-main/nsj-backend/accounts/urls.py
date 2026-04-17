"""Routes for account CRUD APIs without using ViewSets."""

from django.urls import path

from .views import (
    account_detail_view,
    account_balance_view,
    account_master_list_view,
    accounts_collection_view,
    ac_group_master_list_view,
    ac_groups_collection_view,
    ac_group_detail_view,
    accounts_dropdown_view,
    subaccounts_collection_view,
    subaccount_detail_view,
    account_export_view,
    subaccount_export_view,
    accounts_export_all_view,
    subaccounts_export_all_view,
    accounts_tally_export_view,
    ac_groups_tally_export_view,
    account_transactions_list_view,
    account_transactions_tally_export_view,
)

urlpatterns = [
    path("accounts/", accounts_collection_view, name="account-list"),
    path("accounts/<uuid:pk>/", account_detail_view, name="account-detail"),
    path("accounts/<uuid:pk>/balance/", account_balance_view, name="account-balance"),
    path("accounts/masters/", account_master_list_view, name="account-masters"),
    path("accounts/ac-groups/masters/", ac_group_master_list_view, name="ac-group-masters"),
    path("accounts/ac-groups/", ac_groups_collection_view, name="ac-groups-list"),
    path("accounts/ac-groups/<uuid:pk>/", ac_group_detail_view, name="ac-group-detail"),
    path("accounts/dropdown/", accounts_dropdown_view, name="accounts-dropdown"),
    path("accounts/sub-accounts/", subaccounts_collection_view, name="sub-accounts-list"),
    path("accounts/sub-accounts/<uuid:pk>/", subaccount_detail_view, name="sub-account-detail"),
    path("accounts/<uuid:pk>/export/", account_export_view, name="account-export"),
    path(
        "accounts/sub-accounts/<uuid:pk>/export/", subaccount_export_view, name="sub-account-export"
    ),
    path("accounts/export/", accounts_export_all_view, name="accounts-export-all"),
    path(
        "accounts/sub-accounts/export/", subaccounts_export_all_view, name="subaccounts-export-all"
    ),
    path("accounts/tally-export/", accounts_tally_export_view, name="accounts-tally-export"),
    path("accounts/ac-groups/tally-export/", ac_groups_tally_export_view, name="ac-groups-tally-export"),
    path("accounts/transactions/", account_transactions_list_view, name="account-transactions-list"),
    path("accounts/transactions/tally-export/", account_transactions_tally_export_view, name="account-transactions-tally-export"),
]
