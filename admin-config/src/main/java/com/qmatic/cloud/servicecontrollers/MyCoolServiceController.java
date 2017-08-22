package com.qmatic.cloud.servicecontrollers;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.security.Principal;
import java.util.Collection;

import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.fasterxml.jackson.databind.ObjectMapper;

@Controller
public class MyCoolServiceController {
	
	@Autowired
	private EntityXRepository entityXRepository;
	
	public Collection<EntityX> getList() {
		return (Collection<EntityX>)entityXRepository.findAll();
	}
	
	@RequestMapping("/index")
    public String roles(Model model, Principal principal) {

    	model.addAttribute("entities", getList());
    	
    	return "home";
    }


	@RequestMapping(value = "/insert" , method = RequestMethod.POST)
	@ResponseBody
	public String insert(@RequestBody String jsonString, HttpServletResponse response) {
		
		try {
			jsonString = URLDecoder.decode(jsonString, "utf-8");
		} catch (UnsupportedEncodingException e) {
			//Replace with log framework later - when we have decided on logging
			e.printStackTrace();
		}
		
		if(jsonString.endsWith("="))
			jsonString = jsonString.substring(0, jsonString.length()-1);
		
    	try 
    	{
	    	ObjectMapper mapper = new ObjectMapper();
	    	EntityX entity = mapper.readValue(jsonString, EntityX.class);
	    	entityXRepository.save(entity);
		} 
    	catch (Exception e) {
    		//Replace with log framework later - when we have decided on logging
			e.printStackTrace();
		}

    	response.setContentType("text/plain");
	    response.setCharacterEncoding("UTF-8");
	    return jsonString;
	}
	


}