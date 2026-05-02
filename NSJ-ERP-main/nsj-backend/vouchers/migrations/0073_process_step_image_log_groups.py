from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Add log_group + selected_log_group fields to all process-step image/parent models.
    Also adds selected_secondary_log_group to models with two image field types.
    """

    dependencies = [
        ("vouchers", "0072_ordersequence_material_purchase_ids"),
    ]

    operations = [
        # ── TwoDDesign ──────────────────────────────────────────────────────
        migrations.AddField(
            model_name="twoddesignimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="twoddesign",
            name="selected_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (design)",
            ),
        ),
        migrations.AddField(
            model_name="twoddesign",
            name="selected_secondary_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (approved)",
            ),
        ),
        # ── ThreeDDesign ────────────────────────────────────────────────────
        migrations.AddField(
            model_name="threeddesignimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="threeddesign",
            name="selected_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (design)",
            ),
        ),
        migrations.AddField(
            model_name="threeddesign",
            name="selected_secondary_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (approved)",
            ),
        ),
        # ── ThreeDPrintingCAM ────────────────────────────────────────────────
        migrations.AddField(
            model_name="threedprintingcamimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="threedprintingcam",
            name="selected_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (cam_piece)",
            ),
        ),
        migrations.AddField(
            model_name="threedprintingcam",
            name="selected_secondary_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (approved_cam)",
            ),
        ),
        # ── GhatApproval ────────────────────────────────────────────────────
        migrations.AddField(
            model_name="ghatapprovalimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="ghatapproval",
            name="selected_log_group",
            field=models.UUIDField(
                null=True, blank=True, help_text="Log group chosen as the final set of images"
            ),
        ),
        # ── GhatQualityCheck ────────────────────────────────────────────────
        migrations.AddField(
            model_name="ghatqualitycheckimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="ghatqualitycheck",
            name="selected_log_group",
            field=models.UUIDField(
                null=True, blank=True, help_text="Log group chosen as the final set of images"
            ),
        ),
        # ── StoneDemandToBagging ─────────────────────────────────────────────
        migrations.AddField(
            model_name="stonedemandtobaggingimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="selected_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (approved_bagging)",
            ),
        ),
        migrations.AddField(
            model_name="stonedemandtobagging",
            name="selected_secondary_log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                help_text="Log group chosen as the final set of images (carry_forward)",
            ),
        ),
        # ── PreRhodiumQualityCheck ───────────────────────────────────────────
        migrations.AddField(
            model_name="prerhodiumqualitycheckimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="prerhodiumqualitycheck",
            name="selected_log_group",
            field=models.UUIDField(
                null=True, blank=True, help_text="Log group chosen as the final set of images"
            ),
        ),
        # ── ItemFinalPackingList ─────────────────────────────────────────────
        migrations.AddField(
            model_name="itemfinalpackinglistimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="itemfinalpackinglist",
            name="selected_log_group",
            field=models.UUIDField(
                null=True, blank=True, help_text="Log group chosen as the final set of images"
            ),
        ),
        # ── RawMaterialTally ─────────────────────────────────────────────────
        migrations.AddField(
            model_name="rawmaterialtallyimage",
            name="log_group",
            field=models.UUIDField(
                null=True,
                blank=True,
                db_index=True,
                help_text="Groups images saved in the same upload session",
            ),
        ),
        migrations.AddField(
            model_name="rawmaterialtally",
            name="selected_log_group",
            field=models.UUIDField(
                null=True, blank=True, help_text="Log group chosen as the final set of images"
            ),
        ),
    ]
