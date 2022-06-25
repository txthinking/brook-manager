import { Sync } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

export var lock = new Sync().atomic;
export var lockport = new Sync().atomic;
