Em order_manager.rs adicione a variante Cancelled ao enum OrderStatus e o metodo cancel_order(&mut self, id: u64) -> Result<(), String>. Somente pedidos com status Pending podem ser cancelados (passam a Cancelled); pedidos inexistentes ou nao-Pending retornam Err com mensagem descritiva. O pedido nunca deve ser removido do mapa.

Faca os testes em tests/acceptance_test.rs passarem SEM modifica-los. Nao altere assinaturas publicas existentes.
