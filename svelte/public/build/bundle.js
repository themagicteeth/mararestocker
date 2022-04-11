
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\groups\ShopGroup.svelte generated by Svelte v3.47.0 */

    const file$3 = "src\\components\\groups\\ShopGroup.svelte";
    const get_toggle_slot_changes = dirty => ({});
    const get_toggle_slot_context = ctx => ({});

    function create_fragment$j(ctx) {
    	let article;
    	let t;
    	let section;
    	let ul;
    	let current;
    	const toggle_slot_template = /*#slots*/ ctx[1].toggle;
    	const toggle_slot = create_slot(toggle_slot_template, ctx, /*$$scope*/ ctx[0], get_toggle_slot_context);
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			article = element("article");
    			if (toggle_slot) toggle_slot.c();
    			t = space();
    			section = element("section");
    			ul = element("ul");
    			if (default_slot) default_slot.c();
    			attr_dev(ul, "class", "svelte-3pw8dp");
    			add_location(ul, file$3, 3, 8, 67);
    			add_location(section, file$3, 2, 4, 48);
    			attr_dev(article, "class", "svelte-3pw8dp");
    			add_location(article, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);

    			if (toggle_slot) {
    				toggle_slot.m(article, null);
    			}

    			append_dev(article, t);
    			append_dev(article, section);
    			append_dev(section, ul);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (toggle_slot) {
    				if (toggle_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						toggle_slot,
    						toggle_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(toggle_slot_template, /*$$scope*/ ctx[0], dirty, get_toggle_slot_changes),
    						get_toggle_slot_context
    					);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toggle_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toggle_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (toggle_slot) toggle_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ShopGroup', slots, ['toggle','default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ShopGroup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class ShopGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShopGroup",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\components\shops\Shop.svelte generated by Svelte v3.47.0 */

    const file$2 = "src\\components\\shops\\Shop.svelte";

    function create_fragment$i(ctx) {
    	let li;
    	let a;
    	let figure;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let figcaption;
    	let t1;
    	let a_href_value;
    	let a_title_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			figcaption = element("figcaption");
    			t1 = text(/*shopName*/ ctx[0]);
    			if (!src_url_equal(img.src, img_src_value = /*imageUrl*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*shopName*/ ctx[0] + " shop"));
    			add_location(img, file$2, 13, 12, 392);
    			add_location(figcaption, file$2, 14, 12, 450);
    			add_location(figure, file$2, 12, 8, 370);
    			attr_dev(a, "href", a_href_value = "http://www.marapets.com/shop.php?id=" + /*shopId*/ ctx[1]);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "title", a_title_value = "Go to " + /*shopName*/ ctx[0] + " shop");
    			attr_dev(a, "class", "svelte-wjacz8");
    			add_location(a, file$2, 11, 4, 224);
    			attr_dev(li, "class", "svelte-wjacz8");
    			add_location(li, file$2, 10, 0, 214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, figure);
    			append_dev(figure, img);
    			append_dev(figure, t0);
    			append_dev(figure, figcaption);
    			append_dev(figcaption, t1);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*goToShop*/ ctx[3]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imageUrl*/ 4 && !src_url_equal(img.src, img_src_value = /*imageUrl*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*shopName*/ 1 && img_alt_value !== (img_alt_value = "" + (/*shopName*/ ctx[0] + " shop"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*shopName*/ 1) set_data_dev(t1, /*shopName*/ ctx[0]);

    			if (dirty & /*shopId*/ 2 && a_href_value !== (a_href_value = "http://www.marapets.com/shop.php?id=" + /*shopId*/ ctx[1])) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*shopName*/ 1 && a_title_value !== (a_title_value = "Go to " + /*shopName*/ ctx[0] + " shop")) {
    				attr_dev(a, "title", a_title_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shop', slots, []);
    	let { shopName } = $$props;
    	let { shopId } = $$props;
    	let { imageUrl } = $$props;

    	function goToShop() {
    		window.open(`http://www.marapets.com/shop.php?id=${shopId}`, 'marapets');
    	}

    	const writable_props = ['shopName', 'shopId', 'imageUrl'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Shop> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('shopName' in $$props) $$invalidate(0, shopName = $$props.shopName);
    		if ('shopId' in $$props) $$invalidate(1, shopId = $$props.shopId);
    		if ('imageUrl' in $$props) $$invalidate(2, imageUrl = $$props.imageUrl);
    	};

    	$$self.$capture_state = () => ({ shopName, shopId, imageUrl, goToShop });

    	$$self.$inject_state = $$props => {
    		if ('shopName' in $$props) $$invalidate(0, shopName = $$props.shopName);
    		if ('shopId' in $$props) $$invalidate(1, shopId = $$props.shopId);
    		if ('imageUrl' in $$props) $$invalidate(2, imageUrl = $$props.imageUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shopName, shopId, imageUrl, goToShop];
    }

    class Shop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { shopName: 0, shopId: 1, imageUrl: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shop",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shopName*/ ctx[0] === undefined && !('shopName' in props)) {
    			console.warn("<Shop> was created without expected prop 'shopName'");
    		}

    		if (/*shopId*/ ctx[1] === undefined && !('shopId' in props)) {
    			console.warn("<Shop> was created without expected prop 'shopId'");
    		}

    		if (/*imageUrl*/ ctx[2] === undefined && !('imageUrl' in props)) {
    			console.warn("<Shop> was created without expected prop 'imageUrl'");
    		}
    	}

    	get shopName() {
    		throw new Error("<Shop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shopName(value) {
    		throw new Error("<Shop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shopId() {
    		throw new Error("<Shop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shopId(value) {
    		throw new Error("<Shop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imageUrl() {
    		throw new Error("<Shop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageUrl(value) {
    		throw new Error("<Shop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\shops\Clothing.svelte generated by Svelte v3.47.0 */

    function create_fragment$h(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Clothing",
    				shopId: 46,
    				imageUrl: "https://images.marapets.com/icons/Wardrobe.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Clothing', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Clothing> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Clothing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clothing",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\components\shops\DVDs.svelte generated by Svelte v3.47.0 */

    function create_fragment$g(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "DVDs",
    				shopId: 21,
    				imageUrl: "https://images.marapets.com/items/uno_dvd.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DVDs', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DVDs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class DVDs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DVDs",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\components\groups\GroupOne.svelte generated by Svelte v3.47.0 */

    // (7:0) <ShopGroup>
    function create_default_slot$4(ctx) {
    	let dvds;
    	let t;
    	let clothing;
    	let current;
    	dvds = new DVDs({ $$inline: true });
    	clothing = new Clothing({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(dvds.$$.fragment);
    			t = space();
    			create_component(clothing.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dvds, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(clothing, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dvds.$$.fragment, local);
    			transition_in(clothing.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dvds.$$.fragment, local);
    			transition_out(clothing.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dvds, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(clothing, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(7:0) <ShopGroup>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let shopgroup;
    	let current;

    	shopgroup = new ShopGroup({
    			props: {
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shopgroup.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shopgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shopgroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				shopgroup_changes.$$scope = { dirty, ctx };
    			}

    			shopgroup.$set(shopgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shopgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shopgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shopgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GroupOne', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GroupOne> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ShopGroup, Clothing, DVDs });
    	return [];
    }

    class GroupOne extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupOne",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\components\shops\GlowingEggs.svelte generated by Svelte v3.47.0 */

    function create_fragment$e(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Eggs",
    				shopId: 2,
    				imageUrl: "https://images.marapets.com/icons/GlowingEggs.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GlowingEggs', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GlowingEggs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class GlowingEggs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GlowingEggs",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\components\shops\Chocolate.svelte generated by Svelte v3.47.0 */

    function create_fragment$d(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Chocolate",
    				shopId: 17,
    				imageUrl: "https://images.marapets.com/items/ChocAddowMilk.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chocolate', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chocolate> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Chocolate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chocolate",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\components\shops\Pearls.svelte generated by Svelte v3.47.0 */

    function create_fragment$c(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Pearls",
    				shopId: 47,
    				imageUrl: "https://images.marapets.com/items/pearl_white.gif"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pearls', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pearls> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Pearls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pearls",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\components\groups\GroupTwo.svelte generated by Svelte v3.47.0 */

    // (8:0) <ShopGroup>
    function create_default_slot$3(ctx) {
    	let glowingeggs;
    	let t0;
    	let pearls;
    	let t1;
    	let chocolate;
    	let current;
    	glowingeggs = new GlowingEggs({ $$inline: true });
    	pearls = new Pearls({ $$inline: true });
    	chocolate = new Chocolate({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(glowingeggs.$$.fragment);
    			t0 = space();
    			create_component(pearls.$$.fragment);
    			t1 = space();
    			create_component(chocolate.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(glowingeggs, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(pearls, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(chocolate, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(glowingeggs.$$.fragment, local);
    			transition_in(pearls.$$.fragment, local);
    			transition_in(chocolate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(glowingeggs.$$.fragment, local);
    			transition_out(pearls.$$.fragment, local);
    			transition_out(chocolate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(glowingeggs, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(pearls, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(chocolate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(8:0) <ShopGroup>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let shopgroup;
    	let current;

    	shopgroup = new ShopGroup({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shopgroup.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shopgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shopgroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				shopgroup_changes.$$scope = { dirty, ctx };
    			}

    			shopgroup.$set(shopgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shopgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shopgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shopgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GroupTwo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GroupTwo> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ShopGroup,
    		GlowingEggs,
    		Chocolate,
    		Pearls
    	});

    	return [];
    }

    class GroupTwo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupTwo",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\components\shops\Bakery.svelte generated by Svelte v3.47.0 */

    function create_fragment$a(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Bakery",
    				shopId: 33,
    				imageUrl: "https://images.marapets.com/items/CrustyWhiteBread.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Bakery', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Bakery> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Bakery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bakery",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\shops\Candy.svelte generated by Svelte v3.47.0 */

    function create_fragment$9(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Candy",
    				shopId: 18,
    				imageUrl: "https://images.marapets.com/items/dakota_gummy_green.gif"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Candy', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Candy> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Candy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Candy",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\groups\GroupThree.svelte generated by Svelte v3.47.0 */

    // (7:0) <ShopGroup>
    function create_default_slot$2(ctx) {
    	let bakery;
    	let t;
    	let candy;
    	let current;
    	bakery = new Bakery({ $$inline: true });
    	candy = new Candy({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(bakery.$$.fragment);
    			t = space();
    			create_component(candy.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bakery, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(candy, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bakery.$$.fragment, local);
    			transition_in(candy.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bakery.$$.fragment, local);
    			transition_out(candy.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bakery, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(candy, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(7:0) <ShopGroup>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let shopgroup;
    	let current;

    	shopgroup = new ShopGroup({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shopgroup.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shopgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shopgroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				shopgroup_changes.$$scope = { dirty, ctx };
    			}

    			shopgroup.$set(shopgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shopgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shopgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shopgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GroupThree', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GroupThree> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ShopGroup, Bakery, Candy });
    	return [];
    }

    class GroupThree extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupThree",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\shops\Books.svelte generated by Svelte v3.47.0 */

    function create_fragment$7(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Books",
    				shopId: 9,
    				imageUrl: "https://images.marapets.com/items/mara598pets-86.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Books', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Books> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Books extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Books",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\shops\Potions.svelte generated by Svelte v3.47.0 */

    function create_fragment$6(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Potions",
    				shopId: 34,
    				imageUrl: "https://images.marapets.com/items/Blue_Crindol_Pot.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Potions', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Potions> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Potions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Potions",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\groups\GroupFour.svelte generated by Svelte v3.47.0 */

    // (7:0) <ShopGroup>
    function create_default_slot$1(ctx) {
    	let books;
    	let t;
    	let potions;
    	let current;
    	books = new Books({ $$inline: true });
    	potions = new Potions({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(books.$$.fragment);
    			t = space();
    			create_component(potions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(books, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(potions, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(books.$$.fragment, local);
    			transition_in(potions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(books.$$.fragment, local);
    			transition_out(potions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(books, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(potions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(7:0) <ShopGroup>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let shopgroup;
    	let current;

    	shopgroup = new ShopGroup({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shopgroup.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shopgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shopgroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				shopgroup_changes.$$scope = { dirty, ctx };
    			}

    			shopgroup.$set(shopgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shopgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shopgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shopgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GroupFour', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GroupFour> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ShopGroup, Books, Potions });
    	return [];
    }

    class GroupFour extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupFour",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\shops\Stamps.svelte generated by Svelte v3.47.0 */

    function create_fragment$4(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "Stamps",
    				shopId: 15,
    				imageUrl: "https://images.marapets.com/icons/Stamps.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Stamps', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Stamps> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class Stamps extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stamps",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\shops\CDs.svelte generated by Svelte v3.47.0 */

    function create_fragment$3(ctx) {
    	let shop;
    	let current;

    	shop = new Shop({
    			props: {
    				shopName: "CDs",
    				shopId: 25,
    				imageUrl: "https://images.marapets.com/items/cd_huthiqhitsbyhuffix.png"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shop.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shop, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shop, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CDs', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CDs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Shop });
    	return [];
    }

    class CDs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CDs",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\groups\GroupFive.svelte generated by Svelte v3.47.0 */

    // (7:0) <ShopGroup>
    function create_default_slot(ctx) {
    	let stamps;
    	let t;
    	let cds;
    	let current;
    	stamps = new Stamps({ $$inline: true });
    	cds = new CDs({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(stamps.$$.fragment);
    			t = space();
    			create_component(cds.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stamps, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(cds, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stamps.$$.fragment, local);
    			transition_in(cds.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stamps.$$.fragment, local);
    			transition_out(cds.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stamps, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(cds, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(7:0) <ShopGroup>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let shopgroup;
    	let current;

    	shopgroup = new ShopGroup({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shopgroup.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shopgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shopgroup_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				shopgroup_changes.$$scope = { dirty, ctx };
    			}

    			shopgroup.$set(shopgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shopgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shopgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shopgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GroupFive', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GroupFive> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ShopGroup, Stamps, CDs });
    	return [];
    }

    class GroupFive extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GroupFive",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Timer.svelte generated by Svelte v3.47.0 */

    const file$1 = "src\\components\\Timer.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t = text(/*time*/ ctx[0]);
    			add_location(h1, file$1, 22, 4, 532);
    			attr_dev(header, "class", "svelte-1rs4s4z");
    			add_location(header, file$1, 21, 0, 518);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*time*/ 1) set_data_dev(t, /*time*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function addZero(x, n) {
    	if (x.toString().length < n) {
    		return `0${x}`;
    	}

    	return x;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Timer', slots, []);
    	let time = "";

    	setInterval(
    		() => {
    			const d = new Date();

    			const timer = {
    				hours: addZero(d.getHours(), 2) - 2,
    				minutes: `:${addZero(d.getMinutes(), 2)}`,
    				seconds: `:${addZero(d.getSeconds(), 2)}`
    			};

    			$$invalidate(0, time = `${timer.hours}${timer.minutes}${timer.seconds} MST`);
    		},
    		1000
    	);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ time, addZero });

    	$$self.$inject_state = $$props => {
    		if ('time' in $$props) $$invalidate(0, time = $$props.time);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [time];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.47.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let timer;
    	let t0;
    	let main;
    	let groupone;
    	let t1;
    	let grouptwo;
    	let t2;
    	let groupthree;
    	let t3;
    	let groupfour;
    	let t4;
    	let groupfive;
    	let current;
    	timer = new Timer({ $$inline: true });
    	groupone = new GroupOne({ $$inline: true });
    	grouptwo = new GroupTwo({ $$inline: true });
    	groupthree = new GroupThree({ $$inline: true });
    	groupfour = new GroupFour({ $$inline: true });
    	groupfive = new GroupFive({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(timer.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(groupone.$$.fragment);
    			t1 = space();
    			create_component(grouptwo.$$.fragment);
    			t2 = space();
    			create_component(groupthree.$$.fragment);
    			t3 = space();
    			create_component(groupfour.$$.fragment);
    			t4 = space();
    			create_component(groupfive.$$.fragment);
    			add_location(main, file, 11, 0, 403);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(timer, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(groupone, main, null);
    			append_dev(main, t1);
    			mount_component(grouptwo, main, null);
    			append_dev(main, t2);
    			mount_component(groupthree, main, null);
    			append_dev(main, t3);
    			mount_component(groupfour, main, null);
    			append_dev(main, t4);
    			mount_component(groupfive, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			transition_in(groupone.$$.fragment, local);
    			transition_in(grouptwo.$$.fragment, local);
    			transition_in(groupthree.$$.fragment, local);
    			transition_in(groupfour.$$.fragment, local);
    			transition_in(groupfive.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			transition_out(groupone.$$.fragment, local);
    			transition_out(grouptwo.$$.fragment, local);
    			transition_out(groupthree.$$.fragment, local);
    			transition_out(groupfour.$$.fragment, local);
    			transition_out(groupfive.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(timer, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(groupone);
    			destroy_component(grouptwo);
    			destroy_component(groupthree);
    			destroy_component(groupfour);
    			destroy_component(groupfive);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		GroupOne,
    		GroupTwo,
    		GroupThree,
    		GroupFour,
    		GroupFive,
    		Timer
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
