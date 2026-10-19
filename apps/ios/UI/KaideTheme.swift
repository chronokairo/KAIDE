import SwiftUI

public enum KaideTheme {
    public static let background = Color(red: 0.08, green: 0.09, blue: 0.10)
    public static let surface = Color(red: 0.12, green: 0.13, blue: 0.15)
    public static let surfaceElevated = Color(red: 0.16, green: 0.17, blue: 0.20)
    public static let border = Color(red: 0.22, green: 0.24, blue: 0.27)

    public static let accent = Color(red: 0.95, green: 0.65, blue: 0.20) // Âmbar Kaide
    public static let accentSubtle = Color(red: 0.95, green: 0.65, blue: 0.20).opacity(0.15)
    public static let textPrimary = Color.white
    public static let textSecondary = Color(red: 0.65, green: 0.68, blue: 0.72)
    public static let textMuted = Color(red: 0.45, green: 0.48, blue: 0.52)

    public static let success = Color(red: 0.25, green: 0.80, blue: 0.50)
    public static let warning = Color(red: 0.95, green: 0.70, blue: 0.20)
    public static let error = Color(red: 0.95, green: 0.35, blue: 0.35)
}
