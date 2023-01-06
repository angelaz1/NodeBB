'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setActivePostSharingNetworks = exports.getActivePostSharing = exports.getPostSharing = exports.postSharing = void 0;
const lodash_1 = __importDefault(require("lodash"));
const plugins_1 = __importDefault(require("./plugins"));
const database_1 = __importDefault(require("./database"));
exports.postSharing = null;
function getPostSharing() {
    return __awaiter(this, void 0, void 0, function* () {
        if (exports.postSharing) {
            return lodash_1.default.cloneDeep(exports.postSharing);
        }
        let networks = [
            {
                id: 'facebook',
                name: 'Facebook',
                class: 'fa-facebook',
                activated: null,
            },
            {
                id: 'twitter',
                name: 'Twitter',
                class: 'fa-twitter',
                activated: null,
            },
        ];
        networks = yield plugins_1.default.hooks.fire('filter:social.posts', networks);
        const activated = yield database_1.default.getSetMembers('social:posts.activated');
        networks.forEach((network) => {
            network.activated = activated.includes(network.id);
        });
        exports.postSharing = networks;
        return lodash_1.default.cloneDeep(networks);
    });
}
exports.getPostSharing = getPostSharing;
function getActivePostSharing() {
    return __awaiter(this, void 0, void 0, function* () {
        const networks = yield getPostSharing();
        return networks.filter(network => network && network.activated);
    });
}
exports.getActivePostSharing = getActivePostSharing;
function setActivePostSharingNetworks(networkIDs) {
    return __awaiter(this, void 0, void 0, function* () {
        exports.postSharing = null;
        yield database_1.default.delete('social:posts.activated');
        if (!networkIDs.length) {
            return;
        }
        yield database_1.default.setAdd('social:posts.activated', networkIDs);
    });
}
exports.setActivePostSharingNetworks = setActivePostSharingNetworks;
