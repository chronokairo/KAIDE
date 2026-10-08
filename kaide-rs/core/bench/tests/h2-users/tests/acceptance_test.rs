use users::service::UserService;
use users::user::User;

// FIXED ACCEPTANCE TEST — part of the task specification. Do not modify.
// Pins the required API:
//   User::new(name: String, age: u32)
//   UserService::register(&mut self, name: String, age: u32) -> u64

#[test]
fn user_new_takes_name_then_age_u32() {
    let u = User::new(String::from("ana"), 30);
    assert_eq!(u.name, "ana");
    assert_eq!(u.age, 30);
}

#[test]
fn register_places_age_on_the_user_not_on_the_service() {
    let mut svc = UserService::new();
    let id: u64 = svc.register(String::from("bob"), 25);
    let u = svc.get_user(id).expect("registered user must exist");
    assert_eq!(u.age, 25, "age must be stored on User, propagated by register");
}

#[test]
fn ages_are_independent_per_user() {
    let mut svc = UserService::new();
    let a = svc.register(String::from("a"), 20);
    let b = svc.register(String::from("b"), 40);
    assert_eq!(svc.get_user(a).unwrap().age, 20);
    assert_eq!(svc.get_user(b).unwrap().age, 40);
}
