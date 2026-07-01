const MAX_UPGRADE_DISTANCE = 768;
const AUTO_UPGRADE_COOLDOWN_TICKS = 10;

function autoUpgrade() {
    if (!this.myStash || !this.scripts.autoUpgrade) return;

    // Initialize maps once
    if (!this.reupgrader) this.reupgrader = new Map();
    if (!this.inactiveReupgrader) this.inactiveReupgrader = new Map();

    // Refresh upgrade maps
    this.reupgrader.clear();
    this.inactiveReupgrader.clear();

    for (const [, building] of this.autoUpgradeBuildings) {
        const key = `${building.x - this.myStash.x},${building.y - this.myStash.y},${building.type}`;

        this.reupgrader.set(key, building);

        const existing = this.missingAutoUpgradeBuildings.find(b =>
            b.x === building.x &&
            b.y === building.y &&
            b.type === building.type
        );

        if (existing) {
            this.inactiveReupgrader.set(key, existing);
        }
    }

    // Upgrade inactive buildings
    for (const [, building] of this.inactiveReupgrader) {
        const original = this.reupgrader.get(
            `${building.x - this.myStash.x},${building.y - this.myStash.y},${building.type}`
        );

        if (!original) continue;
        if (this.getDistance(building) > MAX_UPGRADE_DISTANCE) continue;

        const shouldUpgrade =
            original.tier === this.myStash.tier
                ? this.ticks % 20 === 0
                : (this.ticks + this.bumpUp) % 20 === 0;

        if (!shouldUpgrade) continue;

        if (!building.upgradeCooldown || building.upgradeCooldown <= this.ticks) {
            building.upgradeCooldown = this.ticks + AUTO_UPGRADE_COOLDOWN_TICKS;
            this.upgradeBuilding(building.uid);
        }
    }
}

export { autoUpgrade };
