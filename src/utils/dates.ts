export function formatDate(date?: Date, format: Intl.DateTimeFormatOptions = {}): string {
    if (!date) {
        return '';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...format,
    });
}
