
import { getStoreBuilder } from "../.."
import { AuthState } from "./auth/state";
import { BirthdayState } from "./birthday/state"

export interface RootState
{
    auth: AuthState
    birthday: BirthdayState
}

const buildStore = () => getStoreBuilder<RootState>().vuexStore();

export {buildStore}