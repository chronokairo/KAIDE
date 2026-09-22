use crate::order_manager::{OrderManager, OrderStatus};

pub struct OrderService {
    pub manager: OrderManager,
}

impl OrderService {
    pub fn new() -> Self {
        Self {
            manager: OrderManager::new(),
        }
    }

    pub fn place_order(&mut self, id: u64, item: &str) {
        self.manager.create_order(id, item);
    }

    pub fn order_status(&self, id: u64) -> Option<OrderStatus> {
        self.manager.get_order(id).map(|o| o.status.clone())
    }
}
