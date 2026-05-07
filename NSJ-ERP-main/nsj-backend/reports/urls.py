from django.urls import path
from .views import account_report

urlpatterns = [
    path("account-report/", account_report, name="account_report"),
]
