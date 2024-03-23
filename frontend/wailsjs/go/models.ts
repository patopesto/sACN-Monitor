export namespace dmx {
	
	export class Interface {
	    name: string;
	    ip: string;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Interface(source);
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
	        this.source_name = source["source_name"];
	        this.priority = source["priority"];
	        this.sync_address = source["sync_address"];
	    }
	}

}

