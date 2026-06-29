const MAX_PLACEMENT_DISTANCE = 576;

function autoRebuild() {
    if (!this.myStash || !this.scripts.autoRebuild) return;

    for (const building of this.missingAutoRebuildBuildings) {
        const x = building.x + this.myStash.x;
        const y = building.y + this.myStash.y;

        if (this.getDistance({ x, y }) > MAX_PLACEMENT_DISTANCE) continue;

        this.makeBuilding(building.type, { x, y }, building.yaw);
    }
}

export { autoRebuild };
