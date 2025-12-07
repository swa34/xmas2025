// Run this script ONCE in browser console after deploying to Firebase
// Navigate to https://xmas-5d97a.web.app, open DevTools (F12), paste this in Console

async function seedDatabase() {
    const db = window.firebaseDB;
    const { doc, setDoc } = window.firebaseUtils;

    if (!db) {
        console.error('Firebase not ready! Refresh the page and try again.');
        return;
    }

    // Jack's data
    const jack = {
        name: "Jack",
        createdAt: Date.now(),
        gifts: [
            { id: crypto.randomUUID(), name: "Soccer Ball", price: 65.00, status: "idea" },
            { id: crypto.randomUUID(), name: "XBOX Headset", price: 100.00, status: "idea" },
            { id: crypto.randomUUID(), name: "Jersey", price: 150.00, status: "idea" },
            { id: crypto.randomUUID(), name: "Magsafe Battery", price: 50.00, status: "idea" },
            { id: crypto.randomUUID(), name: "Pro Xbox Controller", price: 140.00, status: "idea" },
            { id: crypto.randomUUID(), name: "Clothes", price: 65.00, status: "idea" },
            { id: crypto.randomUUID(), name: "Sweat Pants", price: 33.00, status: "idea" }
        ]
    };

    // Wills' data
    const wills = {
        name: "Wills",
        createdAt: Date.now() + 1,
        gifts: [
            { id: crypto.randomUUID(), name: "TV", price: 280.00, status: "idea" },
            { id: crypto.randomUUID(), name: "Letter Jacket", price: 220.00, status: "idea" },
            { id: crypto.randomUUID(), name: "XBOX Headset", price: 100.00, status: "idea" },
            { id: crypto.randomUUID(), name: "Magsafe Battery", price: 50.00, status: "idea" }
        ]
    };

    try {
        await setDoc(doc(db, 'children', crypto.randomUUID()), jack);
        console.log('✅ Jack added!');

        await setDoc(doc(db, 'children', crypto.randomUUID()), wills);
        console.log('✅ Wills added!');

        console.log('🎄 All data seeded! Refresh the page to see it.');
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

// Run it!
seedDatabase();
