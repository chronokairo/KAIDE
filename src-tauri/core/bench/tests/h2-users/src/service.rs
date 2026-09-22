use crate::user::User;

pub struct UserService {
    users: Vec<User>,
}

impl UserService {
    pub fn new() -> Self {
        Self { users: Vec::new() }
    }

    pub fn register(&mut self, name: String) -> u64 {
        let id = self.users.len() as u64;
        self.users.push(User::new(name));
        id
    }

    pub fn get_user(&self, id: u64) -> Option<&User> {
        self.users.get(id as usize)
    }

    pub fn count(&self) -> usize {
        self.users.len()
    }
}
