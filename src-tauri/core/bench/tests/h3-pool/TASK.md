Em pool.rs adicione o metodo checkout(&mut self) -> Result<Buffer, String> que remove e retorna o ultimo buffer do pool (LIFO), ou Err quando o pool estiver vazio. Adicione tambem checkin(&mut self, buffer: Buffer) que devolve um buffer ao pool.

Faca os testes em tests/acceptance_test.rs passarem SEM modifica-los.
