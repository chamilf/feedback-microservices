package com.qmatic.cloud;

import java.net.InetAddress;
import java.net.UnknownHostException;

import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class StatusController {
	
	@RequestMapping("/status")
    public @ResponseBody String status(HttpServletRequest request) throws UnknownHostException {    	
		return "Hello: " + InetAddress.getLocalHost().getHostName() + ":" + InetAddress.getLocalHost().getHostAddress() + " and URI: " + request.getRequestURL().toString();
	} 


}