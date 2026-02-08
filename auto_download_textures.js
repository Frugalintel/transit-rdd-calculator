// Auto-download script for Minecraft textures
// Copy and paste this into browser console on https://minecraftallimages.jemsire.com/

(async function downloadMinecraftTextures() {
    const itemsToDownload = [
        'book', 'chest', 'sign', 'pickaxe', 'cookie', 'feather', 'firework',
        'golden_helmet', 'iron_pickaxe', 'poppy', 'wheat', 'bell', 'totem',
        'chain', 'cooked_chicken', 'cake', 'banner', 'torch', 'redstone_dust'
    ];

    console.log('🎮 Starting Minecraft Texture Download...');
    console.log(`📦 Will download ${itemsToDownload.length} textures`);

    // Function to wait for search results
    function waitForResults() {
        return new Promise(resolve => {
            const checkResults = () => {
                const itemCards = document.querySelectorAll('[data-item-name]');
                if (itemCards.length > 0) {
                    resolve(itemCards);
                } else {
                    setTimeout(checkResults, 100);
                }
            };
            checkResults();
        });
    }

    // Function to select item if found
    function selectItem(itemName) {
        const itemCards = document.querySelectorAll('[data-item-name]');
        for (const card of itemCards) {
            const itemNameAttr = card.getAttribute('data-item-name');
            if (itemNameAttr && itemNameAttr.toLowerCase().includes(itemName.toLowerCase())) {
                const selectButton = card.querySelector('button[title*="Select"]') ||
                                   card.querySelector('button[title*="Deselect"]') ||
                                   card.querySelector('button');
                if (selectButton) {
                    selectButton.click();
                    console.log(`✅ Selected: ${itemName}`);
                    return true;
                }
            }
        }
        console.log(`❌ Not found: ${itemName}`);
        return false;
    }

    let selectedCount = 0;

    for (const itemName of itemsToDownload) {
        // Search for the item
        const searchInput = document.querySelector('input[placeholder*="Search"]') ||
                          document.querySelector('input[type="search"]') ||
                          document.querySelector('input');

        if (searchInput) {
            searchInput.value = itemName;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Wait for results
            await new Promise(resolve => setTimeout(resolve, 500));

            // Try to select the item
            if (selectItem(itemName)) {
                selectedCount++;
            }
        }

        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`🎯 Selected ${selectedCount}/${itemsToDownload.length} items`);

    // Look for download button
    const downloadButton = document.querySelector('button[title*="Download"]') ||
                          document.querySelector('button:contains("ZIP")') ||
                          document.querySelector('button');

    if (downloadButton && downloadButton.textContent.includes('ZIP')) {
        console.log('🚀 Click the "Download Selected as ZIP" button manually!');
        console.log('📁 Extract the ZIP and place PNG files in: public/textures/');
    } else {
        console.log('❌ Could not find download button. Please click "Download Selected as ZIP" manually.');
    }

    console.log('');
    console.log('📋 File mapping needed:');
    itemsToDownload.forEach(item => {
        console.log(`${item}.png → public/textures/${item}.png`);
    });

})();