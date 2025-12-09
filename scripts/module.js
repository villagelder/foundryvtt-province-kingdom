const PK_ID = "province-kingdom";

class KingdomSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [PK_ID, "sheet", "actor", "kingdom"],
      template: `modules/${PK_ID}/templates/kingdom-sheet.html`,
      width: 700,
      height: 700
    });
  }

  getData(options = {}) {
    const data = super.getData(options);

    // Kingdom-level stats stored in flags for now
    const f = (key, def = 0) => this.actor.getFlag(PK_ID, key) ?? def;

      if (this.actor.getFlag(PK_ID, "pkType") !== "kingdom") {
        this.actor.setFlag(PK_ID, "pkType", "kingdom");
      }

    data.pk = {
      type: "kingdom",
      lore:         f("lore"),
      regentPower:  f("regentPower"),
      influence:    f("influence"),
      faith:        f("faith"),
      arcana:       f("arcana"),
      commerce:     f("commerce"),
      timber:       f("timber"),
      iron:         f("iron")
    };


    const provinces = game.actors.filter(a =>
      a.getFlag(PK_ID, "pkType") === "province" &&
      a.getFlag(PK_ID, "ownerKingdomId") === this.actor.id
    );

    const aggregate = {
      lore: 0, regentPower: 0, influence: 0, faith: 0,
      arcana: 0, commerce: 0, timber: 0, iron: 0
    };

    for (const p of provinces) {
      aggregate.lore        += Number(p.getFlag(PK_ID, "lore") ?? 0);
      aggregate.regentPower += Number(p.getFlag(PK_ID, "regentPower") ?? 0);
      aggregate.influence   += Number(p.getFlag(PK_ID, "influence") ?? 0);
      aggregate.faith       += Number(p.getFlag(PK_ID, "faith") ?? 0);
      aggregate.arcana      += Number(p.getFlag(PK_ID, "arcana") ?? 0);
      aggregate.commerce    += Number(p.getFlag(PK_ID, "commerce") ?? 0);
      aggregate.timber      += Number(p.getFlag(PK_ID, "timber") ?? 0);
      aggregate.iron        += Number(p.getFlag(PK_ID, "iron") ?? 0);
    }

    data.pk.provinces = provinces;
    data.pk.aggregate = aggregate;

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find("input[data-pk-field]").on("change", async (event) => {
      const input = event.currentTarget;
      const field = input.dataset.pkField;
      const value = Number(input.value) || 0;
      await this.actor.setFlag(PK_ID, field, value);
    });
  }
}

class ProvinceSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [PK_ID, "sheet", "actor", "province"],
      template: `modules/${PK_ID}/templates/province-sheet.html`,
      width: 600,
      height: 900
    });
  }

  getData(options = {}) {
    const data = super.getData(options);
    const f = (key, def = 0) => this.actor.getFlag(PK_ID, key) ?? def;

    data.pk = {
      type: "province",
      lore:         f("lore"),
      regentPower:  f("regentPower"),
      influence:    f("influence"),
      faith:        f("faith"),
      arcana:       f("arcana"),
      commerce:     f("commerce"),
      timber:       f("timber"),
      iron:         f("iron"),
      ownerKingdomId: this.actor.getFlag(PK_ID, "ownerKingdomId") ?? null
    };

    // Improvements attached as items of type "improvement" (custom subtype via flag)
    data.pk.improvements = this.actor.items.filter(i =>
      i.getFlag(PK_ID, "pkType") === "improvement"
    );

    // War units stationed here: actors with pkType="warUnit" and stationedProvinceId = this actor.id
    data.pk.warUnits = game.actors.filter(a =>
      a.getFlag(PK_ID, "pkType") === "warUnit" &&
      a.getFlag(PK_ID, "stationedProvinceId") === this.actor.id
    );

    const kingdoms = game.actors.filter(a =>
      a.type === "npc" && a.getFlag(PK_ID, "pkType") === "kingdom"
    );

    data.pk.kingdomOptions = kingdoms.map(k => ({
      id: k.id,
      name: k.name,
      selected: k.id === data.pk.ownerKingdomId
    }));

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find("input[data-pk-field]").on("change", async (event) => {
      const input = event.currentTarget;
      const field = input.dataset.pkField;
      const value = Number(input.value) || 0;
      await this.actor.setFlag(PK_ID, field, value);
    });

    html.find("select[data-pk-owner-kingdom]").on("change", async (event) => {
      const select = event.currentTarget;
      const id = select.value || null;
      await this.actor.setFlag(PK_ID, "ownerKingdomId", id);
    });
  }
}

class WarUnitSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [PK_ID, "sheet", "actor", "warunit"],
      template: `modules/${PK_ID}/templates/warunit-sheet.html`,
      width: 650,
      height: 700
    });
  }

  getData(options = {}) {
    const data = super.getData(options);
    const f = (key, def = 0) => this.actor.getFlag(PK_ID, key) ?? def;

    data.pk = {
      type: "warUnit",
      troops:        f("troops"),
      attackBonus:   f("attackBonus"),
      damageDice:    this.actor.getFlag(PK_ID, "damageDice") ?? "",
      speed:         f("speed"),
      hp:            f("hp"),
      ac:            f("ac"),
      stationedProvinceId: this.actor.getFlag(PK_ID, "stationedProvinceId") ?? null
    };

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find("input[data-pk-field]").on("change", async (event) => {
      const input = event.currentTarget;
      const field = input.dataset.pkField;
      let value = input.value;
      if (["troops","attackBonus","speed","hp","ac"].includes(field)) {
        value = Number(value) || 0;
      }
      await this.actor.setFlag(PK_ID, field, value);
    });

    html.find("select[data-pk-stationed-province]").on("change", async (event) => {
      const select = event.currentTarget;
      const id = select.value || null;
      await this.actor.setFlag(PK_ID, "stationedProvinceId", id);
    });
  }
}

class ImprovementSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [PK_ID, "sheet", "item", "improvement"],
      template: `modules/${PK_ID}/templates/improvement-sheet.html`,
      width: 600,
      height: 600
    });
  }

  getData(options = {}) {
    const data = super.getData(options);
    const f = (key, def = 0) => this.item.getFlag(PK_ID, key) ?? def;

    data.pk = {
      type: "improvement",
      // bonuses/penalties to province stats
      bonus: {
        lore:        f("bonusLore"),
        regentPower: f("bonusRegentPower"),
        influence:   f("bonusInfluence"),
        faith:       f("bonusFaith"),
        arcana:      f("bonusArcana"),
        commerce:    f("bonusCommerce"),
        timber:      f("bonusTimber"),
        iron:        f("bonusIron")
      },
      cost: {
        gold:        f("costGold"),
        regentPower: f("costRegentPower")
      },
      buildTime: f("buildTime") // in domain turns
    };

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find("input[data-pk-field]").on("change", async (event) => {
      const input = event.currentTarget;
      const field = input.dataset.pkField;
      const value = Number(input.value) || 0;
      await this.item.setFlag(PK_ID, field, value);
    });
  }
}

// INIT HOOK: register sheet classes
Hooks.once("init", () => {
  console.log("Province-Kingdom | Initializing");

  // Kingdom / Province / War Unit as NPC variants
  Actors.registerSheet(PK_ID, KingdomSheet, {
    label: "Kingdom (Province-Kingdom)",
    types: ["npc"],
    makeDefault: false
  });

  Actors.registerSheet(PK_ID, ProvinceSheet, {
    label: "Province (Province-Kingdom)",
    types: ["npc"],
    makeDefault: false
  });

  Actors.registerSheet(PK_ID, WarUnitSheet, {
    label: "War Unit (Province-Kingdom)",
    types: ["npc"],
    makeDefault: false
  });

  // Improvement as Item variant (start with "feat" or "loot" – you can change)
  Items.registerSheet(PK_ID, ImprovementSheet, {
    label: "Improvement (Province-Kingdom)",
    types: ["feat", "loot"],
    makeDefault: false
  });

  // Expose a helper namespace for future domain logic
  game.provinceKingdom = {
    id: PK_ID
    // later: domain turn manager, calendar sync, map helpers, etc.
  };
});
