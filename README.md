# Bunny Image Optimizer Cloudflare Worker
 Rewrites your images on the fly using [Cloudflare Workers®](https://workers.cloudflare.com/) using the [Bunny Dynamic Image Processing](https://bunny.net/optimizer/transform-api/) service.
 
 Currently supports only WordPress, more coming soon.
 
## Current features
* Rewrites all src and srcset tags.
* Rewrites all div tags with style, data-ultimate-bg, data-image-id attributes and more.
* Rewrites all link tags for icons (apple-touch-icon, etc.).
* Rewrites all special/extra data-src, data-srcset, data-lazyload attributes and more.
* Rewrites all href tags for light boxes/image viewers.
* Rewrites all background image url's for all inline CSS.
* Rewrites all background image url's for all external CSS.
* BONUS: Removes empty SVG tags added by WordPress for no reason.
* BONUS: Rewrites all src and srcset tags in Ajax requests.
* BONUS: Supports multiple WordPress websites under the same Worker.

### Assistance
 In your are in immediate need of commercial help/advice/assistance, I can offer you my assistance for a small fee.
 Please do contact me via my the [consulation page](https://mecanik.dev/en/consulting/) or if you cannot do so open an issue.

### Contribution
 Feel free to contribute with your own functions/methods. Just make sure you tested it properly, otherwise your changes will not be approved.
 
### Support me
 Buy me a coffee to give me more energy and write more code :)
