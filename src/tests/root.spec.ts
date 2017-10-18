import { expect } from "chai"
import { getStoreBuilder, StoreBuilder } from "../index"

interface RootState { name: string }

describe("Create a store", () =>
{
    let storeBuilder: StoreBuilder<RootState>;
    beforeEach(() =>
    {
        storeBuilder = getStoreBuilder<RootState>("root");
        storeBuilder.reset()
    });

    describe("that has no modules (root-only)", () =>
    {
        it("should access root state value", () =>
        {
            const stateReader = storeBuilder.state();
            const store = storeBuilder.vuexStore({
                state: { name: "david" }
            });
            expect(stateReader().name).to.equal("david")
        });
        
        it("should support getters", () =>
        {
            const uppercaseName = (state: RootState) => state.name.toUpperCase();
            const uppercaseNameGetter = storeBuilder.read(uppercaseName);
            const store = storeBuilder.vuexStore({
                state: { name: "david" }
            });
            expect(uppercaseNameGetter()).to.equal("DAVID")
        })
    })
});