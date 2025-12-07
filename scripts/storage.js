export class Storage {
    constructor(key = 'xmas_gift_tracker_data') {
        this.key = key;
    }

    get() {
        const data = localStorage.getItem(this.key);
        if (!data) return this.initialData();
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Data corruption, resetting', e);
            return this.initialData();
        }
    }

    save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    }

    initialData() {
        return {
            children: [],
            settings: {
                snowEnabled: true
            }
        };
    }
}
