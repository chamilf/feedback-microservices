package com.qmatic.cloud.servicecontrollers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;

@RestController
@RequestMapping("/subscriptions/{tenantId}")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @RequestMapping(method = RequestMethod.GET)
    public Collection<Subscription> getSubscriptions(@PathVariable("tenantId") String tenantId) {
        TenantContext.setCurrentTenant(tenantId);
        return  subscriptionService.getSubscriptions();
    }

    @RequestMapping(value = "{id}", method = RequestMethod.GET)
    public Subscription getSubscriptionById(@PathVariable("tenantId") String tenantId, @PathVariable("id") long id) {
        TenantContext.setCurrentTenant(tenantId);
        return subscriptionService.getSubscriptionById(id);
    }

    @RequestMapping(method = RequestMethod.POST)
    public void addSubscription(@PathVariable("tenantId") String tenantId,@RequestBody Subscription subscription) {
        TenantContext.setCurrentTenant(tenantId);
        subscriptionService.saveOrUpdate(subscription);
    }

    @RequestMapping(value = "{id}", method = RequestMethod.DELETE)
    public void deleteSubscriptionById(@PathVariable("tenantId") String tenantId, @PathVariable("id") long id) {
        TenantContext.setCurrentTenant(tenantId);
        subscriptionService.deleteSubscription(id);
    }
}
