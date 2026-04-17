from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_add_user_department_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="plain_password",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
