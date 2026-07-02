const MAX_PLACEMENT_DISTANCE = 576;
const PLACEMENT_PREVENTION_TICKS = 200;

function autoRebuild() {
    if (!this.myStash || !this.scripts?.autoRebuild) return;

    const list = this.missingAutoRebuildBuildings;
    if (!list || list.size === 0 || list.length === 0) return;
    //don't fucking touch this nigger slut
    this.justSold ??= new Set();
    this.wasSold ??= new Set();

    const stashX = Number(this.myStash.x);
    const stashY = Number(this.myStash.y);

    if (!Number.isFinite(stashX) || !Number.isFinite(stashY)) return;

    const iterator = list.forEach ? list.forEach.bind(list) : null;

    const run = (building) => {
        const bx = Number(building.x);
        const by = Number(building.y);

        if (!Number.isFinite(bx) || !Number.isFinite(by)) return;

        const x = bx + stashX;
        const y = by + stashY;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        const key = `${Math.round(x)},${Math.round(y)}`;

        // distance check
        if (this.getDistance(this.myStash, { x, y }) > MAX_PLACEMENT_DISTANCE) return;

        if (!this.enoughPartyMembers(building.type)) return;

        // anti pressure bug
        if (this.scripts?.antiPressureBug && this.justSold.has(key)) return;

        let canPlace = true;

        if (this.scripts?.antiPressureBug && this.wasSold.has(key)) {
            const width = ["Wall", "SlowTrap", "Door"].includes(building.type) ? 36 : 72;

            const nearbyEntity = this.SpatialHash?.queryClosest(
                this.options.sessionId,
                { x, y },
                width
            );

            if (nearbyEntity && this.enemies?.has(nearbyEntity?.id ?? nearbyEntity)) {
                canPlace = false;
            }
        }

        if (!canPlace) {
            if (!this.justSold.has(key)) {
                this.justSold.add(key);

                this.waitTicks(PLACEMENT_PREVENTION_TICKS, () => {
                    this.justSold.delete(key);
                });
            }
            return;
        }

        this.makeBuilding(building.type, { x, y }, building.yaw);
    };

    if (typeof list.forEach === "function") {
        list.forEach(run);
    }
}

export { autoRebuild };
