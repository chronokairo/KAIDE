use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub enum OrderStatus {
    Pending,
    Paid,
    Shipped,
}

#[derive(Debug, Clone)]
pub struct Order {
    pub id: u64,
    pub item: String,
    pub status: OrderStatus,
}

pub struct OrderManager {
    pub orders: HashMap<u64, Order>,
}

impl OrderManager {
    pub fn new() -> Self {
        Self {
            orders: HashMap::new(),
        }
    }

    pub fn create_order(&mut self, id: u64, item: &str) {
        self.orders.insert(
            id,
            Order {
                id,
                item: item.to_string(),
                status: OrderStatus::Pending,
            },
        );
    }

    pub fn get_order(&self, id: u64) -> Option<&Order> {
        self.orders.get(&id)
    }

    pub fn mark_paid(&mut self, id: u64) -> bool {
        if let Some(o) = self.orders.get_mut(&id) {
            if o.status == OrderStatus::Pending {
                o.status = OrderStatus::Paid;
                return true;
            }
        }
        false
    }
}
