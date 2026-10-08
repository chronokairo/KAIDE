use std::time::{Duration, SystemTime, UNIX_EPOCH};

/// Date and time in UTC based on Gregorian civil calendar.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct DateTimeUtc {
    pub year: i32,
    pub month: u8,
    pub day: u8,
    pub hour: u8,
    pub minute: u8,
    pub second: u8,
    pub millisecond: u16,
}

impl DateTimeUtc {
    /// Return the current time as DateTimeUtc using `std::time::SystemTime`.
    pub fn now() -> Self {
        Self::from_system_time(SystemTime::now())
    }

    /// Construct DateTimeUtc from a `SystemTime`.
    pub fn from_system_time(time: SystemTime) -> Self {
        let (secs, millis) = match time.duration_since(UNIX_EPOCH) {
            Ok(d) => (d.as_secs() as i64, d.subsec_millis() as u16),
            Err(e) => {
                let d = e.duration();
                let s = d.as_secs() as i64;
                let sub = d.subsec_millis() as u16;
                if sub == 0 {
                    (-s, 0)
                } else {
                    (-s - 1, 1000 - sub)
                }
            }
        };
        Self::from_unix_secs_and_millis(secs, millis)
    }

    /// Convert unix timestamp in seconds and millisecond to DateTimeUtc.
    pub fn from_unix_secs_and_millis(secs: i64, millis: u16) -> Self {
        let sec_in_day = secs.rem_euclid(86400);
        let days = secs.div_euclid(86400);

        let hour = (sec_in_day / 3600) as u8;
        let minute = ((sec_in_day % 3600) / 60) as u8;
        let second = (sec_in_day % 60) as u8;

        // Civil day to (year, month, day) algorithm
        let z = days + 719468;
        let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
        let doe = (z - era * 146097) as u32;
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        let y = yoe as i64 + era * 400;
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        let mp = (5 * doy + 2) / 153;
        let d = doy - (153 * mp + 2) / 5 + 1;
        let m = if mp < 10 { mp + 3 } else { mp - 9 };
        let y = if m <= 2 { y + 1 } else { y };

        DateTimeUtc {
            year: y as i32,
            month: m as u8,
            day: d as u8,
            hour,
            minute,
            second,
            millisecond: millis,
        }
    }

    /// Convert into unix epoch seconds and milliseconds.
    pub fn to_unix_secs_and_millis(&self) -> (i64, u16) {
        let y = if self.month <= 2 {
            self.year as i64 - 1
        } else {
            self.year as i64
        };
        let m = if self.month <= 2 {
            self.month as i64 + 9
        } else {
            self.month as i64 - 3
        };
        let era = (if y >= 0 { y } else { y - 399 }) / 400;
        let yoe = (y - era * 400) as u64;
        let doy = (153 * m + 2) / 5 + self.day as i64 - 1;
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy as u64;
        let days = era * 146097 + doe as i64 - 719468;

        let secs = days * 86400
            + self.hour as i64 * 3600
            + self.minute as i64 * 60
            + self.second as i64;
        (secs, self.millisecond)
    }

    /// Convert to `std::time::SystemTime`.
    pub fn to_system_time(&self) -> SystemTime {
        let (secs, millis) = self.to_unix_secs_and_millis();
        if secs >= 0 {
            UNIX_EPOCH + Duration::from_secs(secs as u64) + Duration::from_millis(millis as u64)
        } else {
            let neg_secs = (-secs) as u64;
            let dur = Duration::from_secs(neg_secs) - Duration::from_millis(millis as u64);
            UNIX_EPOCH - dur
        }
    }

    /// Format as RFC 3339 / ISO 8601 UTC string: `YYYY-MM-DDTHH:MM:SSZ`
    pub fn to_rfc3339(&self) -> String {
        format!(
            "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
            self.year, self.month, self.day, self.hour, self.minute, self.second
        )
    }

    /// Format as RFC 3339 with milliseconds: `YYYY-MM-DDTHH:MM:SS.mmmZ`
    pub fn to_rfc3339_millis(&self) -> String {
        format!(
            "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
            self.year, self.month, self.day, self.hour, self.minute, self.second, self.millisecond
        )
    }
}

/// Return current UTC timestamp in RFC 3339 format (`YYYY-MM-DDTHH:MM:SSZ`).
pub fn now_utc_rfc3339() -> String {
    DateTimeUtc::now().to_rfc3339()
}

/// Return current UTC timestamp in RFC 3339 format with milliseconds.
pub fn now_utc_rfc3339_millis() -> String {
    DateTimeUtc::now().to_rfc3339_millis()
}

/// Format a `SystemTime` as RFC 3339 UTC string.
pub fn format_system_time_rfc3339(time: SystemTime) -> String {
    DateTimeUtc::from_system_time(time).to_rfc3339()
}

/// Return current timestamp in milliseconds since UNIX epoch.
pub fn now_timestamp_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Calculate local timezone offset in seconds from UTC for the given SystemTime or now.
/// Uses standard platform-native calls without external crates.
fn get_local_offset_seconds() -> i64 {
    #[cfg(windows)]
    {
        #[repr(C)]
        struct SystemTimeWin {
            w_year: u16,
            w_month: u16,
            w_day_of_week: u16,
            w_day: u16,
            w_hour: u16,
            w_minute: u16,
            w_second: u16,
            w_milliseconds: u16,
        }

        #[repr(C)]
        struct TimeZoneInformation {
            bias: i32,
            standard_name: [u16; 32],
            standard_date: SystemTimeWin,
            standard_bias: i32,
            daylight_name: [u16; 32],
            daylight_date: SystemTimeWin,
            daylight_bias: i32,
        }

        extern "system" {
            fn GetTimeZoneInformation(lp_time_zone_information: *mut TimeZoneInformation) -> u32;
        }

        let mut tzi = std::mem::MaybeUninit::<TimeZoneInformation>::uninit();
        let ret = unsafe { GetTimeZoneInformation(tzi.as_mut_ptr()) };
        if ret != 0xFFFFFFFF {
            let tzi = unsafe { tzi.assume_init() };
            let bias_minutes = tzi.bias
                + if ret == 2 {
                    tzi.daylight_bias
                } else {
                    tzi.standard_bias
                };
            return -(bias_minutes as i64) * 60;
        }
    }

    #[cfg(unix)]
    {
        extern "C" {
            fn time(t: *mut i64) -> i64;
            fn localtime_r(timep: *const i64, result: *mut libc_tm) -> *mut libc_tm;
        }

        #[repr(C)]
        struct libc_tm {
            tm_sec: i32,
            tm_min: i32,
            tm_hour: i32,
            tm_mday: i32,
            tm_mon: i32,
            tm_year: i32,
            tm_wday: i32,
            tm_yday: i32,
            tm_isdst: i32,
            tm_gmtoff: i64,
            tm_zone: *const std::os::raw::c_char,
        }

        let mut t = 0i64;
        unsafe {
            time(&mut t);
            let mut tm = std::mem::MaybeUninit::<libc_tm>::uninit();
            if !localtime_r(&t, tm.as_mut_ptr()).is_null() {
                let tm = tm.assume_init();
                return tm.tm_gmtoff;
            }
        }
    }

    0
}

/// Format local time as RFC 3339 with timezone offset, e.g. `2026-09-06T11:49:17-04:00`
pub fn now_local_rfc3339() -> String {
    let now = SystemTime::now();
    let offset_secs = get_local_offset_seconds();
    let local_time = if offset_secs >= 0 {
        now + Duration::from_secs(offset_secs as u64)
    } else {
        now - Duration::from_secs((-offset_secs) as u64)
    };

    let dt = DateTimeUtc::from_system_time(local_time);
    let offset_hours = (offset_secs.abs() / 3600) as u8;
    let offset_minutes = ((offset_secs.abs() % 3600) / 60) as u8;
    let sign = if offset_secs >= 0 { '+' } else { '-' };

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}{}{:02}:{:02}",
        dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, sign, offset_hours, offset_minutes
    )
}

/// Format local time with format `%Y-%m-%dT%H:%M:%S%.3f` (used by FileLogger)
pub fn now_local_iso_millis() -> String {
    let now = SystemTime::now();
    let offset_secs = get_local_offset_seconds();
    let (secs, millis) = match now.duration_since(UNIX_EPOCH) {
        Ok(d) => (d.as_secs() as i64, d.subsec_millis() as u16),
        Err(e) => (-(e.duration().as_secs() as i64), 0),
    };
    let local_secs = secs + offset_secs;
    let dt = DateTimeUtc::from_unix_secs_and_millis(local_secs, millis);

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}",
        dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second, dt.millisecond
    )
}

/// Parse an RFC 3339 or ISO 8601 string into `SystemTime`.
/// Supports `YYYY-MM-DDTHH:MM:SSZ`, `YYYY-MM-DDTHH:MM:SS.fffZ`, and `YYYY-MM-DDTHH:MM:SS(+|-)HH:MM`.
pub fn parse_rfc3339_to_system_time(s: &str) -> Option<SystemTime> {
    let s = s.trim();
    if s.len() < 19 {
        return None;
    }

    let year: i32 = s.get(0..4)?.parse().ok()?;
    if s.as_bytes().get(4)? != &b'-' {
        return None;
    }
    let month: u8 = s.get(5..7)?.parse().ok()?;
    if s.as_bytes().get(7)? != &b'-' {
        return None;
    }
    let day: u8 = s.get(8..10)?.parse().ok()?;

    let t_char = s.as_bytes().get(10)?;
    if *t_char != b'T' && *t_char != b't' && *t_char != b' ' {
        return None;
    }

    let hour: u8 = s.get(11..13)?.parse().ok()?;
    if s.as_bytes().get(13)? != &b':' {
        return None;
    }
    let minute: u8 = s.get(14..16)?.parse().ok()?;
    if s.as_bytes().get(16)? != &b':' {
        return None;
    }
    let second: u8 = s.get(17..19)?.parse().ok()?;

    let mut millis: u16 = 0;
    let mut remainder = &s[19..];

    if remainder.starts_with('.') {
        let mut idx = 1;
        while idx < remainder.len() && remainder.as_bytes()[idx].is_ascii_digit() {
            idx += 1;
        }
        let frac_str = &remainder[1..idx];
        remainder = &remainder[idx..];

        let mut m = 0u32;
        let mut mult = 100u32;
        for b in frac_str.bytes().take(3) {
            m += (b - b'0') as u32 * mult;
            mult /= 10;
        }
        millis = m as u16;
    }

    // Offset
    let mut offset_secs: i64 = 0;
    if remainder == "Z" || remainder == "z" || remainder.is_empty() {
        offset_secs = 0;
    } else if (remainder.starts_with('+') || remainder.starts_with('-')) && remainder.len() >= 6 {
        let sign = if remainder.starts_with('-') { -1 } else { 1 };
        let oh: i64 = remainder.get(1..3)?.parse().ok()?;
        let om: i64 = remainder.get(4..6)?.parse().ok()?;
        offset_secs = sign * (oh * 3600 + om * 60);
    }

    let dt = DateTimeUtc {
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond: millis,
    };
    let (secs, ms) = dt.to_unix_secs_and_millis();
    let utc_secs = secs - offset_secs;

    if utc_secs >= 0 {
        Some(UNIX_EPOCH + Duration::from_secs(utc_secs as u64) + Duration::from_millis(ms as u64))
    } else {
        let neg = (-utc_secs) as u64;
        let dur = Duration::from_secs(neg) - Duration::from_millis(ms as u64);
        Some(UNIX_EPOCH - dur)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_datetime_roundtrip() {
        let dt = DateTimeUtc {
            year: 2026,
            month: 9,
            day: 6,
            hour: 12,
            minute: 34,
            second: 56,
            millisecond: 789,
        };
        let (secs, ms) = dt.to_unix_secs_and_millis();
        let dt2 = DateTimeUtc::from_unix_secs_and_millis(secs, ms);
        assert_eq!(dt, dt2);
        assert_eq!(dt.to_rfc3339(), "2026-09-06T12:34:56Z");
        assert_eq!(dt.to_rfc3339_millis(), "2026-09-06T12:34:56.789Z");
    }

    #[test]
    fn test_parse_rfc3339() {
        let s = "2026-09-06T12:34:56Z";
        let sys = parse_rfc3339_to_system_time(s).expect("parse failed");
        assert_eq!(format_system_time_rfc3339(sys), s);

        let s_with_offset = "2026-09-06T16:34:56+04:00";
        let sys2 = parse_rfc3339_to_system_time(s_with_offset).expect("parse with offset");
        assert_eq!(format_system_time_rfc3339(sys2), "2026-09-06T12:34:56Z");

        let s_millis = "2026-09-06T12:34:56.500Z";
        let sys3 = parse_rfc3339_to_system_time(s_millis).expect("parse with millis");
        let dt3 = DateTimeUtc::from_system_time(sys3);
        assert_eq!(dt3.millisecond, 500);
    }

    #[test]
    fn test_now_functions() {
        let utc = now_utc_rfc3339();
        assert!(utc.ends_with('Z'));
        let local = now_local_rfc3339();
        assert!(local.contains('+') || local.contains('-'));
        let millis = now_timestamp_millis();
        assert!(millis > 1_700_000_000_000);
    }
}
