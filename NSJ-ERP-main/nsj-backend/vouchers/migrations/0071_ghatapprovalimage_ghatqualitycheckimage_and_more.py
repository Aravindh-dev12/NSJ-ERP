import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0016_add_raw_material_dropdown_masters"),
        ("vouchers", "0070_alter_contracreditentry_party_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="GhatApprovalImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("image", models.ImageField(upload_to="ghat_approvals/multi/")),
                ("is_final", models.BooleanField(default=False)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "ghat_approval",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.ghatapproval",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "ghat_approval_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="GhatQualityCheckImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("image", models.ImageField(upload_to="ghat_quality_checks/multi/")),
                ("is_final", models.BooleanField(default=False)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "ghat_quality_check",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.ghatqualitycheck",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "ghat_quality_check_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="ItemFinalPackingListImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "image",
                    models.ImageField(upload_to="item_final_packing_lists/multi/"),
                ),
                ("is_final", models.BooleanField(default=False)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "packing_list",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.itemfinalpackinglist",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "item_final_packing_list_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="PreRhodiumQualityCheckImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "image",
                    models.ImageField(upload_to="pre_rhodium_quality_checks/multi/"),
                ),
                ("is_final", models.BooleanField(default=False)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "pre_rhodium_qc",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.prerhodiumqualitycheck",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "pre_rhodium_quality_check_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="RawMaterialTallyImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("image", models.ImageField(upload_to="raw_material_tallies/multi/")),
                ("is_final", models.BooleanField(default=False)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "raw_material_tally",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.rawmaterialtally",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "raw_material_tally_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="StoneDemandToBaggingImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("image", models.ImageField(upload_to="stone_demand_bagging/multi/")),
                (
                    "field_type",
                    models.CharField(
                        choices=[
                            ("approved_bagging", "Approved Bagging List"),
                            ("carry_forward", "Carry Forward Image"),
                        ],
                        max_length=20,
                    ),
                ),
                ("is_final", models.BooleanField(default=False)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "stone_demand",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.stonedemandtobagging",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "stone_demand_to_bagging_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="ThreeDDesignImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("image", models.ImageField(upload_to="3d_designs/multi/")),
                (
                    "field_type",
                    models.CharField(
                        choices=[
                            ("design", "3D Design Image"),
                            ("approved", "Approved 3D Design Image"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "is_final_design",
                    models.BooleanField(
                        default=False, help_text="Is this the final design image?"
                    ),
                ),
                (
                    "is_final_approved",
                    models.BooleanField(
                        default=False, help_text="Is this the final approved image?"
                    ),
                ),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "three_d_design",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.threeddesign",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "three_d_design_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="ThreeDPrintingCAMImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("image", models.ImageField(upload_to="3d_printing_cam/multi/")),
                (
                    "field_type",
                    models.CharField(
                        choices=[
                            ("cam_piece", "CAM Piece Image"),
                            ("approved_cam", "Approved CAM Piece"),
                            ("carry_forward", "Carry Forward Image"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "is_final",
                    models.BooleanField(
                        default=False,
                        help_text="Is this the final image for this field?",
                    ),
                ),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "three_d_printing_cam",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.threedprintingcam",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "three_d_printing_cam_images",
                "ordering": ["-uploaded_at"],
            },
        ),
        migrations.CreateModel(
            name="TwoDDesign",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "account_order_id",
                    models.CharField(
                        blank=True,
                        help_text="Account & Order ID matching database records",
                        max_length=256,
                        null=True,
                    ),
                ),
                (
                    "is_draft",
                    models.BooleanField(
                        default=False,
                        help_text="True when saved as draft (incomplete); False when fully saved",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="two_d_designs",
                        to="core.company",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_two_d_designs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        blank=True,
                        help_text="Order reference",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="two_d_designs",
                        to="vouchers.order",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_two_d_designs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "two_d_designs",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="TwoDDesignImage",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("image", models.ImageField(upload_to="2d_designs/multi/")),
                (
                    "field_type",
                    models.CharField(
                        choices=[
                            ("design", "2D Design Image"),
                            ("approved", "Approved 2D Design Image"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "is_final_design",
                    models.BooleanField(
                        default=False, help_text="Is this the final design image?"
                    ),
                ),
                (
                    "is_final_approved",
                    models.BooleanField(
                        default=False, help_text="Is this the final approved image?"
                    ),
                ),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "company",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="core.company"
                    ),
                ),
                (
                    "two_d_design",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="vouchers.twoddesign",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "two_d_design_images",
                "ordering": ["-uploaded_at"],
            },
        ),
    ]
