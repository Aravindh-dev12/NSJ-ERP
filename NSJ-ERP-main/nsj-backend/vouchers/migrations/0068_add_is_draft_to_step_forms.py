from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add is_draft boolean field to all step-form models.

    When is_draft=True  → form was saved without validation (Save as Draft)
    When is_draft=False → form was saved with all required fields filled (final save)
    """

    dependencies = [
        ("vouchers", "0067_orderprocessstep_marked_done_at_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="threeddesign",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="threedprintingcam",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="ghatapproval",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="ghatqualitycheck",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="prerhodiumqualitycheck",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="finalqualitycheck",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="itemfinalpackinglist",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialtally",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="metalissue",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="baggingready",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="diamondpurchaseissue",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
        migrations.AddField(
            model_name="gemstonepurchaseissue",
            name="is_draft",
            field=models.BooleanField(
                default=False,
                help_text="True when saved as draft (incomplete); False when fully saved",
            ),
        ),
    ]
