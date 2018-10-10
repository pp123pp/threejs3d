import DoublyLinkedList from "../core/DoublyLinkedList";
import {defined} from "../core/defined";

export default class Cesium3DTilesetCache {
    constructor(){
        this._list = new DoublyLinkedList();
        this._sentinel = this._list.add();
        this._trimTiles = false;
    }

    reset () {
        // Move sentinel node to the tail so, at the start of the frame, all tiles
        // may be potentially replaced.  Tiles are moved to the right of the sentinel
        // when they are selected so they will not be replaced.
        this._list.splice(this._list.tail, this._sentinel);
    }

    touch (tile) {
        let node = tile.cacheNode;
        if (defined(node)) {
            this._list.splice(this._sentinel, node);
        }
    }

    add (tile) {
        if (!defined(tile.cacheNode)) {
            tile.cacheNode = this._list.add(tile);
        }
    };

    unloadTile (tileset, tile, unloadCallback) {
        let node = tile.cacheNode;
        if (!defined(node)) {
            return;
        }

        this._list.remove(node);
        tile.cacheNode = undefined;
        unloadCallback(tileset, tile);
    }

    unloadTiles (tileset, unloadCallback) {
        let trimTiles = this._trimTiles;
        this._trimTiles = false;

        let list = this._list;

        let maximumMemoryUsageInBytes = tileset.maximumMemoryUsage * 1024 * 1024;

        // Traverse the list only to the sentinel since tiles/nodes to the
        // right of the sentinel were used this frame.
        //
        // The sub-list to the left of the sentinel is ordered from LRU to MRU.
        let sentinel = this._sentinel;
        let node = list.head;
        while ((node !== sentinel) && ((tileset.totalMemoryUsageInBytes > maximumMemoryUsageInBytes) || trimTiles)) {
            let tile = node.item;
            node = node.next;
            this.unloadTile(tileset, tile, unloadCallback);
        }
    }

    trim () {
        this._trimTiles = true;
    }
}
