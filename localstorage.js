import localstorage from "https://raw.githubusercontent.com/txthinking/denolib/master/localstorage.js";
import { home } from "https://raw.githubusercontent.com/txthinking/denolib/master/f.js";

var ls = localstorage(home(".brook-manager", "db"));

export default ls;
