use orders::order_manager::OrderStatus;
use orders::service::OrderService;

// FIXED ACCEPTANCE TEST — part of the task specification. Do not modify.
// Pins the required API: cancel_order(&mut self, id: u64) -> Result<(), String>

#[test]
fn cancel_pending_returns_ok_and_marks_cancelled() {
    let mut svc = OrderService::new();
    svc.place_order(1, "keyboard");
    let res: Result<(), String> = svc.manager.cancel_order(1);
    assert!(res.is_ok(), "cancel of a Pending order must succeed");
    assert_eq!(
        svc.order_status(1),
        Some(OrderStatus::Cancelled),
        "cancelled order must transition to Cancelled"
    );
    assert!(
        svc.manager.get_order(1).is_some(),
        "cancelled order must remain in the map (never removed)"
    );
}

#[test]
fn cancel_nonexistent_is_err_not_removal() {
    let mut svc = OrderService::new();
    svc.place_order(5, "mouse");
    let res: Result<(), String> = svc.manager.cancel_order(42);
    assert!(res.is_err(), "cancelling an unknown id must be an error");
    assert!(svc.manager.get_order(5).is_some());
}

#[test]
fn cancel_paid_order_is_err() {
    let mut svc = OrderService::new();
    svc.place_order(2, "monitor");
    assert!(svc.manager.mark_paid(2));
    let res: Result<(), String> = svc.manager.cancel_order(2);
    assert!(res.is_err(), "only Pending orders may be cancelled");
    assert!(matches!(svc.order_status(2), Some(OrderStatus::Paid)));
}
