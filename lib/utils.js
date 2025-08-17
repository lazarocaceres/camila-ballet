export const extractYouTubeID = url => {
    try {
        const u = new URL(url.trim())
        const host = u.hostname.replace(/^www\./, '')
        if (host === 'youtu.be') return u.pathname.slice(1) || null
        if (host === 'youtube.com' || host === 'm.youtube.com') {
            if (u.pathname === '/watch') return u.searchParams.get('v')
            const parts = u.pathname.split('/')
            if (['embed', 'v', 'shorts'].includes(parts[1]))
                return parts[2] || null
        }
        const fallback = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&\/]|$)/)
        return fallback ? fallback[1] : null
    } catch {
        return null
    }
}

export const isEmail = string => /^[\w.+-]+@[\w-]+\.[A-Za-z]{2,}$/.test(string)

export const slugify = input => {
    if (input == null) return undefined
    const str = String(input)
    let normalized

    try {
        normalized = str.normalize('NFD')
    } catch {
        normalized = str
    }

    return normalized
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\/]+/g, '-')
        .replace(/^[\/-]+|[\/-]+$/g, '')
}

export const deslugify = input => {
    if (input == null) return undefined
    const slug = String(input)
    return slug.replace(/-+/g, ' ').trim()
}

export const extractLanguageAndPath = (relativePath = '') => {
    const [lang, filePath = ''] = relativePath.split(/\/(.+)/)
    return { lang, filePath }
}

export const removeFileExtension = input => {
    if (input == null) return input
    const filename = String(input)
    return filename.replace(/\.[^/.]+$/, '')
}
