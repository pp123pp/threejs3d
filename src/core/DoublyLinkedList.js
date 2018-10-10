import {defined} from "./defined";

function DoublyLinkedListNode(item, previous, next) {
    this.item = item;
    this.previous  = previous;
    this.next = next;
}

function remove(list, node) {
    if (defined(node.previous) && defined(node.next)) {
        node.previous.next = node.next;
        node.next.previous = node.previous;
    } else if (defined(node.previous)) {
        // Remove last node
        node.previous.next = undefined;
        list.tail = node.previous;
    } else if (defined(node.next)) {
        // Remove first node
        node.next.previous = undefined;
        list.head = node.next;
    } else {
        // Remove last node in the linked list
        list.head = undefined;
        list.tail = undefined;
    }

    node.next = undefined;
    node.previous = undefined;
}

export default class DoublyLinkedList {
    constructor(){
        this.head = undefined;
        this.tail = undefined;
        this._length = 0;
    }

    get length(){
        return this._length
    }

    add(item){
        var node = new DoublyLinkedListNode(item, this.tail, undefined);

        if (defined(this.tail)) {
            this.tail.next = node;
            this.tail = node;
        } else {
            this.head = node;
            this.tail = node;
        }

        ++this._length;

        return node;
    }

    remove(node){
        if (!defined(node)) {
            return;
        }

        remove(this, node);

        --this._length;
    }

    splice(node, nextNode){
        if (node === nextNode) {
            return;
        }

        // Remove nextNode, then insert after node
        remove(this, nextNode);

        var oldNodeNext = node.next;
        node.next = nextNode;

        // nextNode is the new tail
        if (this.tail === node) {
            this.tail = nextNode;
        } else {
            oldNodeNext.previous = nextNode;
        }

        nextNode.next = oldNodeNext;
        nextNode.previous = node;
    }

}
