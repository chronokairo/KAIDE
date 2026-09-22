use users::service::UserService;

#[test]
fn service_starts_empty() {
    let svc = UserService::new();
    assert_eq!(svc.count(), 0);
}
