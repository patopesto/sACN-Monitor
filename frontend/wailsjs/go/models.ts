export namespace dmx {
	
	export class NetInterface {
	    name: string;
	    ip: string;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NetInterface(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.ip = source["ip"];
	        this.active = source["active"];
	    }
	}
	export class Universe {
	    id: number[];
	    protocol: string;
	    num: number;
	    source: string;
	    data: number[];
	    // Go type: time
	    last_received: any;
	    fps: number;
	    source_name: string;
	    priority: number;
	    sync_address: number;
	
	    static createFrom(source: any = {}) {
	        return new Universe(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.protocol = source["protocol"];
	        this.num = source["num"];
	        this.source = source["source"];
	        this.data = source["data"];
	        this.last_received = this.convertValues(source["last_received"], null);
	        this.fps = source["fps"];
	        this.source_name = source["source_name"];
	        this.priority = source["priority"];
	        this.sync_address = source["sync_address"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

