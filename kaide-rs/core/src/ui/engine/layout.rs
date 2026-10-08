//! Pure std layout primitives matching Ratatui Layout/Rect API.

use std::borrow::Borrow;
use std::rc::Rc;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Rect {
    pub x: u16,
    pub y: u16,
    pub width: u16,
    pub height: u16,
}

impl Rect {
    pub const fn new(x: u16, y: u16, width: u16, height: u16) -> Self {
        Self { x, y, width, height }
    }

    pub fn left(&self) -> u16 { self.x }
    pub fn right(&self) -> u16 { self.x.saturating_add(self.width) }
    pub fn top(&self) -> u16 { self.y }
    pub fn bottom(&self) -> u16 { self.y.saturating_add(self.height) }

    pub fn area(&self) -> usize {
        (self.width as usize) * (self.height as usize)
    }

    pub fn is_empty(&self) -> bool {
        self.width == 0 || self.height == 0
    }

    pub fn inner(self, margin: &Margin) -> Self {
        let x = self.x.saturating_add(margin.horizontal);
        let y = self.y.saturating_add(margin.vertical);
        let width = self.width.saturating_sub(margin.horizontal.saturating_mul(2));
        let height = self.height.saturating_sub(margin.vertical.saturating_mul(2));
        Self { x, y, width, height }
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Margin {
    pub horizontal: u16,
    pub vertical: u16,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Direction {
    Horizontal,
    Vertical,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Alignment {
    #[default]
    Left,
    Center,
    Right,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Constraint {
    Percentage(u16),
    Ratio(u32, u32),
    Length(u16),
    Min(u16),
    Max(u16),
}

#[derive(Clone, Debug)]
pub struct Layout {
    direction: Direction,
    constraints: Vec<Constraint>,
    margin: Margin,
}

impl Default for Layout {
    fn default() -> Self {
        Self {
            direction: Direction::Vertical,
            constraints: Vec::new(),
            margin: Margin::default(),
        }
    }
}

impl Layout {
    pub fn default() -> Self {
        <Self as Default>::default()
    }

    pub fn direction(mut self, direction: Direction) -> Self {
        self.direction = direction;
        self
    }

    pub fn constraints<I>(mut self, constraints: I) -> Self
    where
        I: IntoIterator,
        I::Item: Borrow<Constraint>,
    {
        self.constraints = constraints.into_iter().map(|c| *c.borrow()).collect();
        self
    }

    pub fn margin(mut self, margin: u16) -> Self {
        self.margin = Margin { horizontal: margin, vertical: margin };
        self
    }

    pub fn horizontal_margin(mut self, margin: u16) -> Self {
        self.margin.horizontal = margin;
        self
    }

    pub fn vertical_margin(mut self, margin: u16) -> Self {
        self.margin.vertical = margin;
        self
    }

    pub fn split(&self, area: Rect) -> Rc<[Rect]> {
        let inner = area.inner(&self.margin);
        if self.constraints.is_empty() {
            return Rc::from(vec![inner]);
        }

        let total_size = match self.direction {
            Direction::Horizontal => inner.width,
            Direction::Vertical => inner.height,
        };

        let mut sizes: Vec<u16> = Vec::with_capacity(self.constraints.len());
        let mut is_flex: Vec<bool> = Vec::with_capacity(self.constraints.len());
        let mut initial_sum: u32 = 0;

        for c in &self.constraints {
            let (size, flex) = match *c {
                Constraint::Length(l) => (l, false),
                Constraint::Percentage(p) => (((total_size as u32 * p as u32) / 100) as u16, false),
                Constraint::Ratio(num, den) => {
                    let s = if den == 0 { 0 } else { ((total_size as u32 * num) / den) as u16 };
                    (s, false)
                }
                Constraint::Min(m) => (m, true),
                Constraint::Max(m) => (m, false),
            };
            sizes.push(size);
            is_flex.push(flex);
            initial_sum += size as u32;
        }

        if initial_sum <= total_size as u32 {
            let remaining = (total_size as u32 - initial_sum) as u16;
            let flex_count = is_flex.iter().filter(|&&f| f).count();
            if flex_count > 0 {
                let extra_per_flex = remaining / flex_count as u16;
                let mut remainder = remaining % flex_count as u16;
                for i in 0..sizes.len() {
                    if is_flex[i] {
                        let bonus = extra_per_flex + if remainder > 0 { remainder -= 1; 1 } else { 0 };
                        sizes[i] = sizes[i].saturating_add(bonus);
                    }
                }
            } else if remaining > 0 {
                if let Some(last) = sizes.last_mut() {
                    *last = last.saturating_add(remaining);
                }
            }
        } else {
            let mut cur_remaining = total_size;
            for size in &mut sizes {
                let clamped = (*size).min(cur_remaining);
                cur_remaining = cur_remaining.saturating_sub(clamped);
                *size = clamped;
            }
        }

        let mut pos = match self.direction {
            Direction::Horizontal => inner.x,
            Direction::Vertical => inner.y,
        };

        let mut rects = Vec::with_capacity(sizes.len());
        for size in sizes {
            let rect = match self.direction {
                Direction::Horizontal => Rect::new(pos, inner.y, size, inner.height),
                Direction::Vertical => Rect::new(inner.x, pos, inner.width, size),
            };
            pos = pos.saturating_add(size);
            rects.push(rect);
        }

        Rc::from(rects)
    }
}
