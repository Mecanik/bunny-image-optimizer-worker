/**
 * Worker Name: Bunny Image Optimizer
 * Worker URI: https://github.com/Mecanik/bunny-image-optimizer-worker
 * Description: This worker will replace Image URL's so you can use the Bunny CDN Image Optimizer service.
 * Version: 1.0.0
 * Author: Mecanik
 * Author URI: https://github.com/Mecanik/
 *
 * License: Apache License 2.0 (https://github.com/Mecanik/bunny-image-optimizer-worker/blob/main/LICENSE)
 * Copyright (c) 2024 Mecanik
 **/

// Edit the below as needed
// START EDIT -----------------------------------------------------

/**
 * Multi-site support using the same Worker.
 * Define each domain you want to run through this Worker, each with their configurable options.
 * Using constants because for some unexplainable reason, Worker Enviroment Variables are not loading "sometimes".
 * If you want to remove an IMAGE option, simple set 'undefined'. For example: IMAGE_QUALITY: undefined.
 */
const SITES_CONFIG = [
    /*
	{
        DOMAIN: '...example.com',
		BUNNY_CDN_HOSTNAME: '....b-cdn.net',
		REWRITE_LINK_TAGS: true, REWRITE_STYLE_TAGS: true, REWRITE_IMAGE_TAGS: true, REWRITE_HREF_TAGS: true, REWRITE_DIV_TAGS: true, REWRITE_SVG_TAGS: true,
		IMAGE_LAZY_LOAD: true, IMAGE_QUALITY: 85, IMAGE_SHARPEN: false, IMAGE_CROP: true, IMAGE_CROP_GRAVITY: 'center', IMAGE_BRIGHTNESS: undefined,
		IMAGE_STATURATION: undefined, IMAGE_HUE: undefined, IMAGE_GAMMA: undefined, IMAGE_CONTRAST: undefined,
    },
	*/
    // Add more as needed
];

// END EDIT -------------------------------------------------------
// DO NOT EDIT BELOW THIS LINE. JUST STOP.
// IF YOU NEED ASSISTANCE, BOOK A CONSULTATION: https://mecanik.dev/en/consulting/

const DEFAULT_CONFIG = {

    // Bunny CDN HOSTNAME
    // Ensure you set this up properly in Bunny cdn
	// ONLY HOSTNAME
    BUNNY_CDN_HOSTNAME: '....b-cdn.net',

    // Self explanatory.
    REWRITE_LINK_TAGS: true,
    REWRITE_STYLE_TAGS: true,
    REWRITE_IMAGE_TAGS: true,
    REWRITE_HREF_TAGS: true,
    REWRITE_DIV_TAGS: true,
    REWRITE_SVG_TAGS: true,

    // Browser-level support for lazy loading images.
    // Browsers that do not support the loading attribute simply ignore it without side effects.
    IMAGE_LAZY_LOAD: true,

    // Quality determines the trade-off between image file size and visual quality.
    // Range 1-100
    IMAGE_QUALITY: 85,

    // Sharpen the output image.
    IMAGE_SHARPEN: false,

    // Crop the output image to the given width and height.
    IMAGE_CROP: true,

    // center,forget,east,north,south,west,northeast,northwest,southeast,southwest
    IMAGE_CROP_GRAVITY: 'center',

    // Adjusts the brightness of the output image.
    // Range: -100-100
    IMAGE_BRIGHTNESS: undefined,

    // Adjusts the saturation of the output image. Use -100 for grayscale.
    // Range: -100-100
    IMAGE_STATURATION: undefined,

    // Adjusts the hue of the output image by rotating the color wheel. 
    // Range: 0-100
    IMAGE_HUE: undefined,

    // Adjusts the gamma of the output image.
    // Range: -100-100
    IMAGE_GAMMA: undefined,

    // Adjusts the contrast of the output image.
    // Range: -100-100
    IMAGE_CONTRAST: undefined,
};

function getConfigForDomain(domain) {
    console.debug(`getConfigForDomain -> ${domain}`);
    return SITES_CONFIG.find(config => config.DOMAIN === domain) || DEFAULT_CONFIG;
}

const WidthAndHeightStrip = '-(\\d+)x(\\d+)(?=\\.(\\w+)$)';
const regexWidthAndHeightStrip = new RegExp(`${WidthAndHeightStrip}`, 'i');

const WidthAndHeightInFilename = '-(\\d+)x(\\d+)(?=\\.\\w+$)';
const regexWidthAndHeightInFilename = new RegExp(`${WidthAndHeightInFilename}`);

const WidthDescriptor = '(\\d+)w$';
const regexWidthDescriptor = new RegExp(`${WidthDescriptor}`);

const Sizes = '(\\d+)x(\\d+)';
const regexSizes = new RegExp(`${Sizes}`, '');

const Src = '(https?:\\/\\/(?:www\\.|(?!www)).*?|\/\/.*?)(\\/wp-content\\/(?:uploads|plugins|themes)\\/.*?\\.(?:jpe?g|gif|png|webp|svg))(.*?)';
const rgxSrc = new RegExp(`${Src}`, 'g');

const Css = "url\\(['\"]?((?!\\/cdn-cgi\\/image\\/)(https?:\\/\\/(?:www\\.|(?!www))[^\\s]+?)?(\\/wp-content\\/(?:uploads|plugins|themes)\\/[^\\s]+?\\.(?:jpe?g|gif|png|webp|svg)))['\"]?\\)";
const rgxCss = new RegExp(`${Css}`, 'g');

/**
 * Utils.
 * @author Mecanik
 * @version 1.0.0
 */
class Utils {
    static generateCdnUrl(config, originalUrl, width = null, height = null) {
        // Parse the original URL
        const parsedURL = new URL(originalUrl);

        // Replace the hostname with the one specified in config
        parsedURL.hostname = config.BUNNY_CDN_HOSTNAME;

        // Start constructing the CDN parameters
        let CDNParams = '?';

        // Conditionally append width and height
        CDNParams += width && height ? `width=${width}&height=${height}` : 'width=auto&height=auto';

        // Append other configurations, always prefixed with '&'
        CDNParams += config.IMAGE_QUALITY ? `&quality=${config.IMAGE_QUALITY}` : '';
        CDNParams += config.IMAGE_SHARPEN ? `&sharpen=${config.IMAGE_SHARPEN}` : '';
        CDNParams += config.IMAGE_CROP ? (width && height ? `&crop=${width},${height}` : '') : '';
        CDNParams += config.IMAGE_CROP ? ((width && height && config.IMAGE_CROP_GRAVITY) ? `&crop_gravity=${config.IMAGE_CROP_GRAVITY}` : '') : '';
        CDNParams += config.IMAGE_BRIGHTNESS ? `&brightness=${config.IMAGE_BRIGHTNESS}` : '';
        CDNParams += config.IMAGE_STATURATION ? `&saturation=${config.IMAGE_STATURATION}` : '';
        CDNParams += config.IMAGE_HUE ? `&hue=${config.IMAGE_HUE}` : '';
        CDNParams += config.IMAGE_GAMMA ? `&gamma=${config.IMAGE_GAMMA}` : '';
        CDNParams += config.IMAGE_CONTRAST ? `&contrast=${config.IMAGE_CONTRAST}` : '';

        // Set the CDN parameters as the URL's search, replacing any existing parameters
        parsedURL.search = CDNParams;

        // Return the modified URL
        return parsedURL.href;
    }

    static generateCdnParams(config, width = 'auto', height = 'auto') {
        let params = `?width=${width}&height=${height}`;
        params += config.IMAGE_QUALITY ? `&quality=${config.IMAGE_QUALITY}` : '';
        params += config.IMAGE_SHARPEN ? `&sharpen=${config.IMAGE_SHARPEN}` : '';
        // The condition for IMAGE_CROP is removed since it's not adding anything directly
        params += config.IMAGE_CROP_GRAVITY ? `&crop_gravity=${config.IMAGE_CROP_GRAVITY}` : '';
        params += config.IMAGE_BRIGHTNESS ? `&brightness=${config.IMAGE_BRIGHTNESS}` : '';
        params += config.IMAGE_STATURATION ? `&saturation=${config.IMAGE_STATURATION}` : '';
        params += config.IMAGE_HUE ? `&hue=${config.IMAGE_HUE}` : '';
        params += config.IMAGE_GAMMA ? `&gamma=${config.IMAGE_GAMMA}` : '';
        params += config.IMAGE_CONTRAST ? `&contrast=${config.IMAGE_CONTRAST}` : '';

        return params;
    }

    static isValidImage(src, config) {
        return src &&
            src.indexOf("base64") === -1 &&
            src.indexOf(`/wp-content/`) !== -1 &&
            src.indexOf(config.BUNNY_CDN_HOSTNAME) === -1;
    }
}

/**
 * Rewrites the <img> tags, including source sets, plugins like Revolution Slider and more.
 * @author Mecanik
 * @version 1.0.0
 */
class ImageTagRewriter extends HTMLRewriter {
    constructor(config) {
        super();
        this.config = config;
    }

    async element(element) {
        // If skip flag is true, exit early.
        if (this.config.REWRITE_IMAGE_TAGS !== true) {
            console.debug(`ImageTagRewriter -> ${this.config.REWRITE_IMAGE_TAGS} (skipping)`);
            return;
        }

        // This is a responsive image set
        if (element.hasAttribute("src") && element.hasAttribute("srcset")) {
            // Process src
            let src = element.getAttribute("src");

            if (Utils.isValidImage(src, this.config)) {

                let width = element.getAttribute("width");
                let height = element.getAttribute("height");
                let hasSizes = !!width && !!height;

                if (hasSizes) {

                    src = src.replace(regexWidthAndHeightStrip, '');

                    src = Utils.generateCdnUrl(this.config, src, width, height);
                } else {
                    // Try to extract the width and height from the filename
                    let match = src.match(regexWidthAndHeightInFilename);

                    if (match) {
                        let _width = match[1];
                        let _height = match[2];

                        src = src.replace(regexWidthAndHeightStrip, '');

                        src = Utils.generateCdnUrl(this.config, src, _width, _height);

                    } else {
                        src = Utils.generateCdnUrl(this.config, src);
                    }
                }

                element.setAttribute("src", src);
            }

            // Now the srcset... this is a bit more complicated.
            let srcset = element.getAttribute("srcset");

            if (Utils.isValidImage(srcset, this.config)) {
                // Split the srcset value into an array of image descriptors, using regex to split by comma possibly followed by space(s)
                let descriptors = srcset.split(/\s*,\s*/);

                // Iterate through the descriptors and modify each URL
                descriptors = descriptors.map(descriptor => {

                    // Split on whitespace
                    let parts = descriptor.trim().split(/\s+/);

                    // If unexpected format, return original descriptor
                    if (parts.length !== 2)
                        return descriptor;

                    // This should return us 2 parts: ["https://....Image-300x200.jpg", "300w"] 
                    let url = parts[0];
                    let width = parts[1];

                    // Try to extract the width and height from the filename
                    // If we fail, just fall back to the width descriptor
                    let match = url.match(regexWidthAndHeightInFilename);

                    if (match) {
                        let _width = match[1];
                        let _height = match[2];

                        // Remove the sizes from the filename, pointing original image to Bunny for cropping
                        url = url.replace(regexWidthAndHeightStrip, '');

                        url = Utils.generateCdnUrl(this.config, url, _width, _height);

                    } else {
                        // Extract width descriptor at the end, if filename did not contain dimensions
                        match = width.match(regexWidthDescriptor);

                        if (match) {
                            let _width = match[1];

                            url = Utils.generateCdnUrl(this.config, url, _width);

                        } else {
                            // Well, everything is fucked. But we still point the image to Bunny!!!

                            url = Utils.generateCdnUrl(this.config, url);
                        }
                    }

                    // Reconstruct the descriptor
                    return `${url} ${width}`;
                });

                // Join the modified descriptors back into a string
                let modifiedSrcset = descriptors.join(', ');

                element.setAttribute("srcset", modifiedSrcset);
            }
        }
        // This is a normal image
        else if (element.hasAttribute("src") && !element.hasAttribute("srcset")) {
            let src = element.getAttribute("src");

            if (Utils.isValidImage(src, this.config)) {

                let width = element.getAttribute("width");
                let height = element.getAttribute("height");
                let hasSizes = !!width && !!height;

                if (hasSizes) {

                    src = src.replace(regexWidthAndHeightStrip, '');

                    src = Utils.generateCdnUrl(this.config, src, width, height);
                } else {
                    // Try to extract the width and height from the filename
                    let match = src.match(regexWidthAndHeightInFilename);

                    if (match) {
                        let _width = match[1];
                        let _height = match[2];

                        src = src.replace(regexWidthAndHeightStrip, '');

                        src = Utils.generateCdnUrl(this.config, src, _width, _height);

                    } else {
                        src = Utils.generateCdnUrl(this.config, src);
                    }
                }

                element.setAttribute("src", src);
            }
        }

        // Extra
        let datasrc = element.getAttribute("data-src");

        if (Utils.isValidImage(datasrc, this.config)) {

            let width = element.getAttribute("width");
            let height = element.getAttribute("height");
            let hasSizes = !!width && !!height;

            if (hasSizes) {
                // Remove the sizes from the filename, pointing original image to Bunny for cropping
                datasrc = datasrc.replace(regexWidthAndHeightStrip, '');

                // Insert the CDN Hostname and Parameters
                datasrc = Utils.generateCdnUrl(this.config, datasrc, width, height);
            } else {
                // Try to extract the width and height from the filename
                let match = datasrc.match(regexWidthAndHeightInFilename);

                if (match) {
                    let _width = match[1];
                    let _height = match[2];

                    datasrc = datasrc.replace(regexWidthAndHeightStrip, '');

                    datasrc = Utils.generateCdnUrl(this.config, datasrc, _width, _height);

                } else {
                    datasrc = Utils.generateCdnUrl(this.config, datasrc);
                }
            }

            element.setAttribute("data-src", datasrc);
        }

        // Extra
        const datasrcset = element.getAttribute("data-srcset");

        if (Utils.isValidImage(datasrcset, this.config)) {
            // Split the datasrcset value into an array of image descriptors, using regex to split by comma possibly followed by space(s)
            let descriptors = datasrcset.split(/\s*,\s*/);

            // Iterate through the descriptors and modify each URL
            descriptors = descriptors.map(descriptor => {

                // Split on whitespace
                let parts = descriptor.trim().split(/\s+/);

                // If unexpected format, return original descriptor
                if (parts.length !== 2)
                    return descriptor;

                // This should return us 2 parts: ["https://....Image-300x200.jpg", "300w"] 
                let url = parts[0];
                let width = parts[1];

                // Try to extract the width and height from the filename
                // If we fail, just fall back to the width descriptor

                let match = url.match(regexWidthAndHeightInFilename);

                if (match) {
                    let _width = match[1];
                    let _height = match[2];

                    // Remove the sizes from the filename, pointing original image to Bunny for cropping
                    url = url.replace(regexWidthAndHeightStrip, '');

                    url = Utils.generateCdnUrl(this.config, url, _width, _height);

                } else {
                    // Extract width descriptor at the end, if filename did not contain dimensions
                    match = width.match(regexWidthDescriptor);

                    if (match) {
                        let _width = match[1];

                        url = Utils.generateCdnUrl(this.config, url, _width);

                    } else {
                        // Well, everything is fucked. But we still point the image to Bunny!!!

                        url = Utils.generateCdnUrl(this.config, url);
                    }
                }

                // Reconstruct the descriptor
                return `${url} ${width}`;
            });

            // Join the modified descriptors back into a string
            let modifiedSrcset = descriptors.join(', ');

            element.setAttribute("data-srcset", modifiedSrcset);
        }

        // Extra - handle "smart" plugins like Revolution Slider and other bananas
        let datalazyload = element.getAttribute("data-lazyload");

        if (Utils.isValidImage(datalazyload, this.config)) {

            let width = element.getAttribute("width");
            let height = element.getAttribute("height");
            let hasSizes = !!width && !!height;

            if (hasSizes) {
                // Remove the sizes from the filename, pointing original image to Bunny for cropping
                datalazyload = datalazyload.replace(regexWidthAndHeightStrip, '');

                // Insert the CDN Hostname and Parameters
                datalazyload = Utils.generateCdnUrl(this.config, datalazyload, width, height);
            } else {
                // Try to extract the width and height from the filename
                let match = datalazyload.match(regexWidthAndHeightInFilename);

                if (match) {
                    let _width = match[1];
                    let _height = match[2];

                    datalazyload = datalazyload.replace(regexWidthAndHeightStrip, '');

                    datalazyload = Utils.generateCdnUrl(this.config, datalazyload, _width, _height);

                } else {
                    datalazyload = Utils.generateCdnUrl(this.config, datalazyload);
                }
            }

            element.setAttribute("data-lazyload", datalazyload);
        }

        // Extra - handle "smart" plugins like WP Rocket and other bananas
        let datalazysrc = element.getAttribute("data-lazy-src");

        if (Utils.isValidImage(datalazysrc, this.config)) {

            let width = element.getAttribute("width");
            let height = element.getAttribute("height");
            let hasSizes = !!width && !!height;

            if (hasSizes) {
                // Remove the sizes from the filename, pointing original image to Bunny for cropping
                datalazysrc = datalazysrc.replace(regexWidthAndHeightStrip, '');

                // Insert the CDN Hostname and Parameters
                datalazysrc = Utils.generateCdnUrl(this.config, datalazysrc, width, height);
            } else {
                // Try to extract the width and height from the filename
                let match = datalazysrc.match(regexWidthAndHeightInFilename);

                if (match) {
                    let _width = match[1];
                    let _height = match[2];

                    datalazysrc = datalazysrc.replace(regexWidthAndHeightStrip, '');

                    datalazysrc = Utils.generateCdnUrl(this.config, datalazysrc, _width, _height);

                } else {
                    datalazysrc = Utils.generateCdnUrl(this.config, datalazysrc);
                }
            }

            element.setAttribute("data-lazy-src", datalazysrc);
        }

        // Extra - handle "smart" plugins like WP Rocket and other bananas
        const datalazysrcset = element.getAttribute("data-lazy-srcset");

        if (Utils.isValidImage(datalazysrcset, this.config)) {
            // Split the srcset value into an array of image descriptors, using regex to split by comma possibly followed by space(s)
            let descriptors = datalazysrcset.split(/\s*,\s*/);

            // Iterate through the descriptors and modify each URL
            descriptors = descriptors.map(descriptor => {

                // Split on whitespace
                let parts = descriptor.trim().split(/\s+/);

                // If unexpected format, return original descriptor
                if (parts.length !== 2)
                    return descriptor;

                // This should return us 2 parts: ["https://....Image-300x200.jpg", "300w"] 
                let url = parts[0];
                let width = parts[1];

                // Try to extract the width and height from the filename
                // If we fail, just fall back to the width descriptor
                let match;

                match = url.match(regexWidthAndHeightInFilename);

                if (match) {
                    let _width = match[1];
                    let _height = match[2];

                    // Remove the sizes from the filename, pointing original image to Bunny for cropping
                    url = url.replace(regexWidthAndHeightStrip, '');

                    url = Utils.generateCdnUrl(this.config, url, _width, _height);

                } else {
                    // Extract width descriptor at the end, if filename did not contain dimensions
                    match = width.match(regexWidthDescriptor);

                    if (match) {
                        let _width = match[1];

                        url = Utils.generateCdnUrl(this.config, url, _width);

                    } else {
                        // Well, everything is fucked. But we still point the image to Bunny!!!

                        url = Utils.generateCdnUrl(this.config, url);
                    }
                }

                // Reconstruct the descriptor
                return `${url} ${width}`;
            });

            // Join the modified descriptors back into a string
            let modifiedSrcset = descriptors.join(', ');

            element.setAttribute("data-lazy-srcset", modifiedSrcset);
        }

        // Lazy load
        if (!element.hasAttribute("loading") && this.config.IMAGE_LAZY_LOAD === true) {
            element.setAttribute("loading", "lazy");
        }
    }
}

/**
 * Rewrites the <a> tags, mostly used by image viewers like lightbox
 * @author Mecanik
 * @version 1.0.0
 */
class HrefTagRewriter extends HTMLRewriter {
    constructor(config) {
        super();
        this.config = config;
    }

    async element(element) {
        // If skip flag is true, exit early.
        if (this.config.REWRITE_HREF_TAGS === false) {
            console.debug(`HrefTagRewriter -> ${this.config.REWRITE_HREF_TAGS} (skipping)`);
            return;
        }

        if (element.hasAttribute("href")) {
            let href = element.getAttribute("href");

            if (Utils.isValidImage(href, this.config)) {

                let result = Utils.generateCdnUrl(this.config, href);

                element.setAttribute("href", result);
            }
        }
    }
}

/**
 * Rewrites the <svg> tags, used to remove the empty svg's wordpress adds for no reason
 * @author Mecanik
 * @version 1.0.0
 */
class SvgTagRewriter extends HTMLRewriter {
    constructor(config) {
        super();
        this.config = config;
    }

    async element(element) {
        // If skip flag is true, exit early.
        if (this.config.REWRITE_SVG_TAGS === false) {
            console.debug(`SvgTagRewriter -> ${this.config.REWRITE_SVG_TAGS} (skipping)`);
            return;
        }

        const viewBox = element.getAttribute("viewBox");
        const _class = element.getAttribute("class");
        const style = element.getAttribute("style");

        // Remove: https://github.com/WordPress/gutenberg/issues/38299
        // GG WP :)		
        if (viewBox && viewBox === "0 0 0 0" && !_class && style && style === "visibility: hidden; position: absolute; left: -9999px; overflow: hidden;") {
            element.remove();
        }
    }
}

/**
 * Rewrites the <style> tags, used to replace image sources for inline CSS
 * @author Mecanik
 * @version 1.0.0
 */
class StyleTagRewriter extends HTMLRewriter {
    constructor(config) {
        super();
        this.buffer = "";
        this.transformedBuffer = "";
        this.config = config;
    }

    async text(inlineCSS) {
        // If skip flag is true, exit early.
        if (this.config.REWRITE_STYLE_TAGS === false) {
            console.debug(`StyleTagRewriter -> ${this.config.REWRITE_STYLE_TAGS} (skipping)`);
            return;
        }

        if (inlineCSS.text.indexOf("#wpadminbar") !== -1) {
            console.debug(`StyleTagRewriter -> WP Admin Bar CSS (skipping)`);
            return;
        }

        // Buffering the text content
        this.buffer += inlineCSS.text;

        // If this is the last chunk, process the buffered content
        if (inlineCSS.lastInTextNode) {

            let CDN = '?width=auto&height=auto';
            CDN += this.config.IMAGE_QUALITY ? `&quality=${this.config.IMAGE_QUALITY}` : '';
            CDN += this.config.IMAGE_SHARPEN ? `&sharpen=${this.config.IMAGE_SHARPEN}` : '';
            //CDN += this.config.IMAGE_CROP ? '' : '';
            //CDN += this.config.IMAGE_CROP ? (this.config.IMAGE_CROP_GRAVITY ? `crop_gravity=${this.config.IMAGE_CROP_GRAVITY}` : '') : '';
            CDN += this.config.IMAGE_BRIGHTNESS ? `&brightness=${this.config.IMAGE_BRIGHTNESS}` : '';
            CDN += this.config.IMAGE_STATURATION ? `&saturation=${this.config.IMAGE_STATURATION}` : '';
            CDN += this.config.IMAGE_HUE ? `&hue=${this.config.IMAGE_HUE}` : '';
            CDN += this.config.IMAGE_GAMMA ? `&gamma=${this.config.IMAGE_GAMMA}` : '';
            CDN += this.config.IMAGE_CONTRAST ? `&contrast=${this.config.IMAGE_CONTRAST}` : '';

            let result = this.buffer.replace(rgxCss, `url('$2$3${CDN}')`);

            // Replace with the processed content
            inlineCSS.replace(result, {
                html: false
            });

            this.transformedBuffer = result.replace(/&gt;/g, '>');
        }
    }

    async element(element) {
        if (this.transformedBuffer) {
            element.setInnerContent(this.transformedBuffer, {
                html: true
            });
            this.buffer = "";
            this.transformedBuffer = "";
        }
    }
}

/**
 * Rewrites the <div> tags, used to replace image sources for inline CSS, plugins and more
 * @author Mecanik
 * @version 1.0.0
 */
class DivTagRewriter extends HTMLRewriter {
    constructor(config) {
        super();
        this.config = config;
    }

    async element(element) {
        // If skip flag is true, exit early.
        if (this.config.REWRITE_DIV_TAGS === false) {
            console.debug(`DivTagRewriter -> ${this.config.REWRITE_DIV_TAGS} (skipping)`);
            return;
        }

        const style = element.getAttribute("style");

        if (Utils.isValidImage(style, this.config)) {

            // Generate CDN parameters
            const CDN = Utils.generateCdnParams(this.config);

            let result = style.replace(rgxCss, `url('https://${this.config.BUNNY_CDN_HOSTNAME}$3${CDN}')`);

            element.setAttribute("style", result);
        }

        // Handle "smart" plugins like "Ultimate_VC_Addons"
        let dataultimatebg = element.getAttribute("data-ultimate-bg");

        if (Utils.isValidImage(dataultimatebg, this.config)) {

            // Try to extract the width and height from the filename
            let match = dataultimatebg.match(regexWidthAndHeightInFilename);

            if (match) {
                let _width = match[1];
                let _height = match[2];

                dataultimatebg = dataultimatebg.replace(regexWidthAndHeightStrip, '');

                dataultimatebg = Utils.generateCdnUrl(this.config, dataultimatebg, _width, _height);

            } else {
                dataultimatebg = Utils.generateCdnUrl(this.config, dataultimatebg);
            }

            element.setAttribute("data-ultimate-bg", dataultimatebg);
        }

        // Handle "smart" plugins like "Ultimate_VC_Addons"
        let dataimageid = element.getAttribute("data-image-id");

        if (Utils.isValidImage(dataimageid, this.config)) {

            // Try to extract the width and height from the filename
            let match = dataultimatebg.match(regexWidthAndHeightInFilename);

            if (match) {
                let _width = match[1];
                let _height = match[2];

                dataimageid = dataimageid.replace(regexWidthAndHeightStrip, '');

                dataimageid = Utils.generateCdnUrl(this.config, dataimageid, _width, _height);

            } else {
                dataimageid = Utils.generateCdnUrl(this.config, dataimageid);
            }

            element.setAttribute("data-image-id", dataimageid);
        }
    }
}

/**
 * Rewrites the <link> tags, used to replace image sources for icons
 * @author Mecanik
 * @version 1.0.0
 */
class LinkTagRewriter extends HTMLRewriter {
    constructor(config) {
        super();
        this.config = config;
    }

    async element(element) {
        // If skip flag is true, exit early.
        if (this.config.REWRITE_LINK_TAGS === false) {
            console.debug(`LinkTagRewriter -> ${this.config.REWRITE_LINK_TAGS} (skipping)`);
            return;
        }

        if (element.hasAttribute("rel")) {
            const rel = element.getAttribute("rel");

            if (rel && rel === "shortcut icon" || rel === "icon" || rel === "apple-touch-icon" || rel === "apple-touch-icon-precomposed") {

                let href = element.getAttribute("href");

                if (Utils.isValidImage(href, this.config) && href.indexOf('.ico') === -1) {

                    let sizes = element.getAttribute("sizes");
                    let matches = regexSizes.exec(sizes);
                    let hasSizes = !!matches;

                    // Remove the sizes from the filename, pointing original image to Bunny for cropping
                    if (hasSizes) {
                        href = href.replace(regexWidthAndHeightStrip, '');

                        // Generate CDN URL
                        href = Utils.generateCdnUrl(this.config, href, matches[0], matches[1]);
                    } else {
                        // Try to extract the width and height from the filename
                        let match = href.match(regexWidthAndHeightInFilename);

                        if (match) {
                            let _width = match[1];
                            let _height = match[2];

                            href = href.replace(regexWidthAndHeightStrip, '');

                            href = Utils.generateCdnUrl(this.config, href, _width, _height);
                        } else {
                            href = Utils.generateCdnUrl(this.config, href);
                        }
                    }

                    element.setAttribute("href", href);
                }
            }
        }
    }
}

/**
 * Entry point for worker in module syntax
 * @author Mecanik
 * @version 1.0.0
 */
export default {
    async fetch(request, env, ctx) {

        // If an error occurs, do not break the site, just continue
        ctx.passThroughOnException();

        // We need to fetch the origin full response.
        const originResponse = await fetch(request);

        if (originResponse.status !== 200) {
            console.error(`Invalid Origin HTTP Status: ${originResponse.status}`);
            return originResponse;
        }

        const {
            origin,
            pathname,
            hostname
        } = new URL(request.url);

        // If the content type is HTML, we will run the rewriter
        // If running APO this is not returned once the page is cached on the Edge servers.
        const contentType = originResponse.headers.get("content-type");

        if (contentType === null) {
            console.error(`Missing Content Type: ${contentType}`);
            return originResponse;
        }

        if (contentType.startsWith("text/html")) {
            // Do not rewrite images inside these paths (save some cost?)
            if (pathname.indexOf("/wp-admin/") !== -1 || pathname.indexOf("/wp-login/") !== -1) {
                console.error(`Bypassing page by path: ${pathname}`);
                return originResponse;
            }

            const domain = hostname.toLowerCase();
            const currentConfig = getConfigForDomain(domain);

            let newResponse = new HTMLRewriter()
                .on('link', new LinkTagRewriter(currentConfig))
                .on('style', new StyleTagRewriter(currentConfig))
                .on('img', new ImageTagRewriter(currentConfig))
                .on('a', new HrefTagRewriter(currentConfig))
                .on('svg', new SvgTagRewriter(currentConfig))
                .on('div', new DivTagRewriter(currentConfig))
                .transform(originResponse);

            return newResponse;
        }
        // Trick or Treat? We replace images inside ALL CSS files you have :)
        else if (contentType.startsWith("text/css")) {
            // Do not rewrite images inside these paths (save some cost?)
            if (pathname.indexOf("/wp-admin/") !== -1 || pathname.indexOf("/wp-login/") !== -1) {
                console.error(`Bypassing page by path: ${pathname}`);
                return originResponse;
            }

            const domain = hostname.toLowerCase();
            const currentConfig = getConfigForDomain(domain);

            // Generate CDN parameters
            const CDN = Utils.generateCdnParams(currentConfig);

            const originalBody = await originResponse.text();

            let result = originalBody.replace(rgxCss, `url('https://${currentConfig.BUNNY_CDN_HOSTNAME}$3${CDN}')`);

            const response = new Response(result, {
                headers: originResponse.headers,
            });

            return response;

        }
        // Trick or Treat? We replace images inside JSON response :)
        else if (contentType.startsWith("application/json")) {
            const domain = hostname.toLowerCase();
            const currentConfig = getConfigForDomain(domain);

            // Fetch the original response body and parse it as JSON
            const originalBody = await originResponse.json();

            // Check if the 'data' field contains any '<img>' tags
            if (!originalBody.data || !originalBody.data.includes("<img")) {
                console.error(`There is no image detected in the JSON response.`);
                return originResponse;
            }

            // Convert the HTML string to a Response object for HTMLRewriter
            const modifiedHtmlContentResponsePromise = new HTMLRewriter()
                .on('img', new ImageTagRewriter(currentConfig))
                .transform(new Response(originalBody.data));

            // Wait for the HTMLRewriter to process the content
            const modifiedHtmlContent = await modifiedHtmlContentResponsePromise.text();

            // Re-construct the JSON response with modified HTML
            const modifiedBody = {
                ...originalBody,
                data: modifiedHtmlContent
            };

            // Copy the original response headers
            const newHeaders = new Headers(originResponse.headers);

            // Since Content-Length might have changed, remove it
            newHeaders.delete('Content-Length');

            // Return a new response with the modified body and original headers
            return new Response(JSON.stringify(modifiedBody), {
                status: originResponse.status,
                statusText: originResponse.statusText,
                headers: newHeaders
            });
        } else {
            console.error(`Invalid Content Type: ${contentType}`);
            return originResponse;
        }
    }
}