To update igv,

(1) download igv.js

    wget https://cdn.jsdelivr.net/npm/igv@2.10.5/dist/igv.min.js

(2) 

replace (at the beginning of the file)
 
    function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).igv=e()}
    
with

    (function (global, factory) {window.igv = factory()})    
       
    