"""
Auto-complete process steps when tasks are completed in other modules
"""

from django.utils import timezone
from vouchers.models import Order, OrderProcessStep
import logging

logger = logging.getLogger(__name__)


def auto_complete_step_by_name(order_id, step_name, notes="Auto-completed", reference_id=None):
    """
    Auto-complete a process step by name

    Args:
        order_id: UUID of the order
        step_name: Name of the step to complete (e.g., "Advance Received")
        notes: Optional notes for the completion
        reference_id: Optional UUID of the related record (e.g., 3D Design ID, Receipt ID)

    Returns:
        dict: Result with success status and message
    """
    try:
        order = Order.objects.get(id=order_id)

        # Find the step by name
        step = OrderProcessStep.objects.filter(order=order, step_name=step_name).first()

        if not step:
            # Step doesn't exist - return success with warning instead of error
            # This handles cases where orders don't have all 29 steps
            logger.warning(f"Step '{step_name}' not found for order {order_id}")
            return {
                "success": True,
                "message": f"Step '{step_name}' not found for this order (skipped)",
                "skipped": True,
            }

        # Only auto-complete if not already completed
        if step.status == "COMPLETED":
            return {
                "success": True,
                "message": f"Step '{step_name}' already completed",
                "already_completed": True,
            }

        # Update step status
        step.status = "COMPLETED"
        step.completed_at = timezone.now()
        step.notes = f"{step.notes}\n{notes}" if step.notes else notes

        # Store reference_id if provided
        if reference_id:
            step.reference_id = reference_id

        step.save()

        logger.info(f"Auto-completed step '{step_name}' for order {order_id}")

        return {
            "success": True,
            "message": f"Step '{step_name}' auto-completed successfully",
            "step_id": str(step.id),
            "reference_id": str(reference_id) if reference_id else None,
            "completed_at": step.completed_at.isoformat(),
        }

    except Order.DoesNotExist:
        return {"success": False, "message": f"Order {order_id} not found"}
    except Exception as e:
        logger.error(f"Error auto-completing step: {str(e)}", exc_info=True)
        return {"success": False, "message": f"Error: {str(e)}"}


def auto_complete_advance_received(order_id, receipt_id=None):
    """Auto-complete 'Advance Received' step when receipt is created"""
    notes = f"Auto-completed: Receipt created"
    if receipt_id:
        notes += f" (Receipt ID: {receipt_id})"
    return auto_complete_step_by_name(order_id, "Advance Received", notes, reference_id=receipt_id)


def auto_complete_3d_design(order_id, design_id=None):
    """Auto-complete '3D Design' step when 3D design is created"""
    notes = f"Auto-completed: 3D Design created"
    if design_id:
        notes += f" (Design ID: {design_id})"
    return auto_complete_step_by_name(order_id, "3D Design", notes, reference_id=design_id)


def auto_complete_3d_printing(order_id, printing_id=None):
    """Auto-complete '3D Printing/CAM Piece' step"""
    notes = f"Auto-completed: 3D Printing/CAM completed"
    if printing_id:
        notes += f" (Printing ID: {printing_id})"
    return auto_complete_step_by_name(
        order_id, "3D Printing/CAM Piece", notes, reference_id=printing_id
    )


def auto_complete_stone_demand(order_id, demand_id=None):
    """Auto-complete 'Stone Demand to Bagging' step"""
    notes = f"Auto-completed: Stone demand created"
    if demand_id:
        notes += f" (Demand ID: {demand_id})"
    return auto_complete_step_by_name(
        order_id, "Stone Demand to Bagging", notes, reference_id=demand_id
    )


def auto_complete_metal_issue(order_id, issue_id=None):
    """Auto-complete 'Metal Issue' step"""
    notes = f"Auto-completed: Metal issued"
    if issue_id:
        notes += f" (Issue ID: {issue_id})"
    return auto_complete_step_by_name(order_id, "Metal Issue", notes, reference_id=issue_id)


def auto_complete_ghat_qc(order_id, qc_id=None):
    """Auto-complete 'Ghat QC' step"""
    notes = f"Auto-completed: Ghat QC completed"
    if qc_id:
        notes += f" (QC ID: {qc_id})"
    return auto_complete_step_by_name(order_id, "Ghat QC", notes, reference_id=qc_id)


def auto_complete_bagging_ready(order_id, bagging_id=None):
    """Auto-complete 'Bagging Ready' step"""
    notes = f"Auto-completed: Bagging ready"
    if bagging_id:
        notes += f" (Bagging ID: {bagging_id})"
    return auto_complete_step_by_name(order_id, "Bagging Ready", notes, reference_id=bagging_id)


def auto_complete_diamond_purchase(order_id, purchase_id=None):
    """Auto-complete 'Diamond Purchase/Issue' step"""
    notes = f"Auto-completed: Diamond purchase/issue completed"
    if purchase_id:
        notes += f" (Purchase ID: {purchase_id})"
    return auto_complete_step_by_name(
        order_id, "Diamond Purchase/Issue", notes, reference_id=purchase_id
    )


def auto_complete_gemstone_purchase(order_id, purchase_id=None):
    """Auto-complete 'Gemstone Purchase/Issue' step"""
    notes = f"Auto-completed: Gemstone purchase/issue completed"
    if purchase_id:
        notes += f" (Purchase ID: {purchase_id})"
    return auto_complete_step_by_name(
        order_id, "Gemstone Purchase/Issue", notes, reference_id=purchase_id
    )


def auto_complete_pre_rhodium_qc(order_id, qc_id=None):
    """Auto-complete 'Pre Rhodium QC' step"""
    notes = f"Auto-completed: Pre Rhodium QC completed"
    if qc_id:
        notes += f" (QC ID: {qc_id})"
    return auto_complete_step_by_name(order_id, "Pre Rhodium QC", notes, reference_id=qc_id)


def auto_complete_final_packing(order_id, packing_id=None):
    """Auto-complete 'Item with Final Packing List In' step"""
    notes = f"Auto-completed: Final packing completed"
    if packing_id:
        notes += f" (Packing ID: {packing_id})"
    return auto_complete_step_by_name(
        order_id, "Item with Final Packing List In", notes, reference_id=packing_id
    )


def auto_complete_raw_material_tally(order_id, tally_id=None):
    """Auto-complete 'Raw Material Tally' step"""
    notes = f"Auto-completed: Raw material tally completed"
    if tally_id:
        notes += f" (Tally ID: {tally_id})"
    return auto_complete_step_by_name(order_id, "Raw Material Tally", notes, reference_id=tally_id)


def auto_complete_invoice(order_id, invoice_id=None):
    """Auto-complete 'Invoice' step"""
    notes = f"Auto-completed: Invoice generated"
    if invoice_id:
        notes += f" (Invoice ID: {invoice_id})"
    return auto_complete_step_by_name(order_id, "Invoice", notes, reference_id=invoice_id)


def auto_complete_payment(order_id, payment_id=None):
    """Auto-complete 'Payment' step"""
    notes = f"Auto-completed: Payment received"
    if payment_id:
        notes += f" (Payment ID: {payment_id})"
    return auto_complete_step_by_name(order_id, "Payment", notes, reference_id=payment_id)


def auto_complete_payment(order_id, payment_id=None):
    """Auto-complete 'Payment' step"""
    notes = "Auto-completed: Payment received"
    if payment_id:
        notes += f" (Payment ID: {payment_id})"
    return auto_complete_step_by_name(order_id, "Payment", notes)


def auto_complete_2d_design_approval(order_id, approval_id=None):
    """Auto-complete '2D Design Approval' step"""
    notes = "Auto-completed: 2D Design approved"
    if approval_id:
        notes += f" (Approval ID: {approval_id})"
    return auto_complete_step_by_name(
        order_id, "2D Design Approval", notes, reference_id=approval_id
    )


def auto_complete_estimate_approval(order_id, estimate_id=None):
    """Auto-complete 'Estimate Approval' step"""
    notes = "Auto-completed: Estimate approved"
    if estimate_id:
        notes += f" (Estimate ID: {estimate_id})"
    return auto_complete_step_by_name(
        order_id, "Estimate Approval", notes, reference_id=estimate_id
    )


def auto_complete_order_issue_karigar(order_id, issue_id=None):
    """Auto-complete 'Order Issue to Karigar' step"""
    notes = "Auto-completed: Order issued to karigar"
    if issue_id:
        notes += f" (Issue ID: {issue_id})"
    return auto_complete_step_by_name(
        order_id, "Order Issue to Karigar", notes, reference_id=issue_id
    )


def auto_complete_3d_design_approval(order_id, approval_id=None):
    """Auto-complete '3D Design Approval' step"""
    notes = "Auto-completed: 3D Design approved"
    if approval_id:
        notes += f" (Approval ID: {approval_id})"
    return auto_complete_step_by_name(
        order_id, "3D Design Approval", notes, reference_id=approval_id
    )


def auto_complete_cam_qc(order_id, qc_id=None):
    """Auto-complete 'CAM Piece QC' step"""
    notes = "Auto-completed: CAM Piece QC completed"
    if qc_id:
        notes += f" (QC ID: {qc_id})"
    return auto_complete_step_by_name(order_id, "CAM Piece QC", notes, reference_id=qc_id)


def auto_complete_cam_trial_approval(order_id, approval_id=None):
    """Auto-complete 'CAM Piece Trial Approval' step"""
    notes = "Auto-completed: CAM Piece trial approved"
    if approval_id:
        notes += f" (Approval ID: {approval_id})"
    return auto_complete_step_by_name(
        order_id, "CAM Piece Trial Approval", notes, reference_id=approval_id
    )


def auto_complete_casting(order_id, casting_id=None):
    """Auto-complete 'Casting' step"""
    notes = "Auto-completed: Casting completed"
    if casting_id:
        notes += f" (Casting ID: {casting_id})"
    return auto_complete_step_by_name(order_id, "Casting", notes, reference_id=casting_id)


def auto_complete_ghat_trial_approval(order_id, approval_id=None):
    """Auto-complete 'Ghat Trial Approval' step"""
    notes = "Auto-completed: Ghat trial approved"
    if approval_id:
        notes += f" (Approval ID: {approval_id})"
    return auto_complete_step_by_name(
        order_id, "Ghat Trial Approval", notes, reference_id=approval_id
    )


def auto_complete_stone_setting(order_id, setting_id=None):
    """Auto-complete 'Stone Setting' step"""
    notes = "Auto-completed: Stone setting completed"
    if setting_id:
        notes += f" (Setting ID: {setting_id})"
    return auto_complete_step_by_name(order_id, "Stone Setting", notes, reference_id=setting_id)


def auto_complete_rhodium_stamping(order_id, rhodium_id=None):
    """Auto-complete 'Rhodium + Stamping' step"""
    notes = "Auto-completed: Rhodium and stamping completed"
    if rhodium_id:
        notes += f" (Rhodium ID: {rhodium_id})"
    return auto_complete_step_by_name(
        order_id, "Rhodium + Stamping", notes, reference_id=rhodium_id
    )


def auto_complete_photo_video(order_id, media_id=None):
    """Auto-complete 'Photo/Video for Catalogue' step"""
    notes = "Auto-completed: Photo/Video uploaded"
    if media_id:
        notes += f" (Media ID: {media_id})"
    return auto_complete_step_by_name(
        order_id, "Photo/Video for Catalogue", notes, reference_id=media_id
    )


def auto_complete_tagging(order_id, tag_id=None):
    """Auto-complete 'Tagging' step"""
    notes = "Auto-completed: Item tagged"
    if tag_id:
        notes += f" (Tag ID: {tag_id})"
    return auto_complete_step_by_name(order_id, "Tagging", notes, reference_id=tag_id)


def auto_complete_certification(order_id, cert_id=None):
    """Auto-complete 'Certification' step"""
    notes = "Auto-completed: Certificate generated"
    if cert_id:
        notes += f" (Certificate ID: {cert_id})"
    return auto_complete_step_by_name(order_id, "Certification", notes, reference_id=cert_id)


def auto_complete_delivery(order_id, delivery_id=None):
    """Auto-complete 'Delivery' step"""
    notes = "Auto-completed: Item delivered"
    if delivery_id:
        notes += f" (Delivery ID: {delivery_id})"
    return auto_complete_step_by_name(order_id, "Delivery", notes, reference_id=delivery_id)


# Mapping of step names to auto-complete functions
STEP_AUTO_COMPLETE_MAP = {
    "Advance Received": auto_complete_advance_received,
    "2D Design Approval": auto_complete_2d_design_approval,
    "Estimate Approval": auto_complete_estimate_approval,
    "Order Issue to Karigar": auto_complete_order_issue_karigar,
    "3D Design": auto_complete_3d_design,
    "3D Design Approval": auto_complete_3d_design_approval,
    "3D Printing/CAM Piece": auto_complete_3d_printing,
    "CAM Piece QC": auto_complete_cam_qc,
    "CAM Piece Trial Approval": auto_complete_cam_trial_approval,
    "Stone Demand to Bagging": auto_complete_stone_demand,
    "Metal Issue": auto_complete_metal_issue,
    "Casting": auto_complete_casting,
    "Ghat QC": auto_complete_ghat_qc,
    "Ghat Trial Approval": auto_complete_ghat_trial_approval,
    "Bagging Ready": auto_complete_bagging_ready,
    "Diamond Purchase/Issue": auto_complete_diamond_purchase,
    "Gemstone Purchase/Issue": auto_complete_gemstone_purchase,
    "Stone Setting": auto_complete_stone_setting,
    "Pre Rhodium QC": auto_complete_pre_rhodium_qc,
    "Rhodium + Stamping": auto_complete_rhodium_stamping,
    "Item with Final Packing List In": auto_complete_final_packing,
    "Raw Material Tally": auto_complete_raw_material_tally,
    "Photo/Video for Catalogue": auto_complete_photo_video,
    "Tagging": auto_complete_tagging,
    "Certification": auto_complete_certification,
    "Invoice": auto_complete_invoice,
    "Payment": auto_complete_payment,
    "Delivery": auto_complete_delivery,
}
