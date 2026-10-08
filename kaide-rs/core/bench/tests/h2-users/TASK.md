Em user.rs adicione o campo age: u32 ao struct User e atualize o construtor para User::new(name: String, age: u32), nesta ordem. Em service.rs propague: register(&mut self, name: String, age: u32) -> u64 deve repassar o valor ao User criado via User::new.

Faca os testes em tests/acceptance_test.rs passarem SEM modifica-los.
