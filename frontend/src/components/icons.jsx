/* Hand-drawn SVG marks for PrintStation.
   No emoji — the machine's own iconography, drawn in ink. */

/* Brand: a sheet of paper with the CMYK registration bars on its edge */
export function BrandMark({ className, style }) {
    return (
        <svg className={className} style={style} viewBox="0 0 46 46" fill="none" aria-hidden="true">
            <rect x="6" y="4" width="30" height="38" rx="3" fill="#FFFFFF" stroke="#1E2833" strokeWidth="3" />
            <rect x="6" y="4" width="30" height="7" rx="3" fill="#1E2833" />
            <rect x="6" y="4" width="7.5" height="7" fill="#00A3D6" />
            <rect x="13.5" y="4" width="7.5" height="7" fill="#E5007D" />
            <rect x="21" y="4" width="7.5" height="7" fill="#F5C400" />
            <line x1="12" y1="20" x2="30" y2="20" stroke="#1E2833" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="27" x2="30" y2="27" stroke="#8B95A0" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="34" x2="24" y2="34" stroke="#8B95A0" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

/* Upload: a document with an up arrow */
export function DropMark({ className }) {
    return (
        <svg className={className} width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <rect x="10" y="6" width="36" height="44" rx="4" fill="#FFFFFF" stroke="#1E2833" strokeWidth="3" />
            <path d="M28 40V20" stroke="#00A3D6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 27L28 19L36 27" stroke="#00A3D6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* Success: a stamped check */
export function SuccessMark({ className, style }) {
    return (
        <svg className={className} style={style} width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <circle cx="26" cy="26" r="22" fill="#E1F3FA" stroke="#00A3D6" strokeWidth="3" />
            <path d="M16 27L23 34L37 19" stroke="#1E2833" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* AI: a spark — the magenta voice */
export function AiMark({ className, style }) {
    return (
        <svg className={className} style={style} width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <rect x="4" y="4" width="30" height="30" rx="8" fill="#FDE7F1" stroke="#E5007D" strokeWidth="2.5" />
            <path d="M19 9L21.6 16.4L29 19L21.6 21.6L19 29L16.4 21.6L9 19L16.4 16.4L19 9Z" fill="#E5007D" />
        </svg>
    );
}

/* Kiosk: the machine itself */
export function KioskMark({ className }) {
    return (
        <svg className={className} width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <rect x="4" y="3" width="26" height="20" rx="3" fill="#F2F3ED" stroke="#F4F6F1" strokeWidth="2.5" />
            <rect x="4" y="3" width="26" height="4.5" fill="#00A3D6" />
            <rect x="4" y="7.5" width="26" height="4.5" fill="#E5007D" />
            <rect x="4" y="12" width="26" height="4.5" fill="#F5C400" />
            <rect x="4" y="16.5" width="26" height="6.5" fill="#1E2833" />
            <path d="M10 27H24L26 32H8L10 27Z" fill="#2A3642" stroke="#F4F6F1" strokeWidth="2" />
        </svg>
    );
}

/* Collect tray: paper dropping into a tray */
export function TrayArrow({ className }) {
    return (
        <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="8" y="4" width="24" height="14" rx="2" fill="#FFFFFF" stroke="#1E2833" strokeWidth="3" />
            <path d="M20 21V29" stroke="#1E2833" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M14 25L20 31L26 25" stroke="#1E2833" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 36H34" stroke="#1E2833" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
    );
}

/* Party / celebration for dispensed prints */
export function CelebrateMark({ className }) {
    return (
        <svg className={className} width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <path d="M12 44L26 18L40 44" stroke="#1E2833" strokeWidth="3.5" strokeLinejoin="round" fill="#F5C400" />
            <path d="M12 44H40" stroke="#1E2833" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="10" cy="14" r="3" fill="#00A3D6" />
            <circle cx="46" cy="12" r="3" fill="#E5007D" />
            <circle cx="48" cy="30" r="2.5" fill="#F5C400" />
            <circle cx="8" cy="30" r="2.5" fill="#E5007D" />
            <rect x="26" y="4" width="4" height="6" rx="1.5" fill="#00A3D6" />
        </svg>
    );
}
