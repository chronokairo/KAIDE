use orders::order_manager::OrderStatus;
use orders::service::OrderService;

#[test]
fn placed_order_is_pending() {
    let mut svc = OrderService::new();
    svc.place_order(1, "keyboard");
    assert!(matches!(svc.order_status(1), Some(OrderStatus::Pending)));
}

#[test]
fn mark_paid_transitions_pending_only() {
    let mut svc = OrderService::new();
    svc.place_order(7, "cable");
    assert!(svc.manager.mark_paid(7));
    assert!(matches!(svc.order_status(7), Some(OrderStatus::Paid)));
}
