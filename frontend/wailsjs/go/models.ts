export namespace dmx {
	
	export class Interface {
	    name: string;
	    ip: string;
	
	    static createFrom(source: any = {}) {
	        return new Interface(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.ip = source["ip"];
	    }
	}
	export class Universe {
	    id: number[];
	    protocol: string;
	    num: number;
	    source: string;
	
	    static createFrom(source: any = {}) {
	        return new Universe(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.protocol = source["protocol"];
	        this.num = source["num"];
	        this.source = source["source"];
	    }
	}

}

