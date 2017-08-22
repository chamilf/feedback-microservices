package com.qmatic.cloud;

import com.qmatic.cloud.servicecontrollers.TenantContext;
import com.qmatic.cloud.servicecontrollers.TenantSupport;
import org.hibernate.EmptyInterceptor;
import org.hibernate.type.Type;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.orm.jpa.JpaProperties;
import org.springframework.boot.autoconfigure.security.oauth2.client.EnableOAuth2Sso;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.stereotype.Controller;

import javax.sql.DataSource;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
@EnableOAuth2Sso
@Controller
public class QmaticCloudServiceApplication extends WebSecurityConfigurerAdapter {

	public static void main(String[] args) {
		SpringApplication.run(QmaticCloudServiceApplication.class, args);
	}
	
	@Override
    public void configure(HttpSecurity http) throws Exception {
    	/*http.logout().logoutSuccessUrl("/admin/home");
    	
        http.logout().and().antMatcher("/**").authorizeRequests()
        		.antMatchers("/login","/auth/**").permitAll()
                .antMatchers("/fonts/**", "/js/**", "/css/**", "/status/**", "/status").permitAll()
                //.antMatchers("/**").hasRole("READER")
                .anyRequest().authenticated().and().csrf().disable();

        http
          .headers()
	        .frameOptions().sameOrigin();
*/
    	http.authorizeRequests().antMatchers("/*").permitAll();
		http.csrf().disable();
    }

	/*@Bean
	public LocalContainerEntityManagerFactoryBean entityManagerFactory(EntityManagerFactoryBuilder factory, DataSource dataSource, JpaProperties properties) {
		Map<String, Object> jpaProperties = new HashMap<>();
		jpaProperties.putAll(properties.getHibernateProperties(dataSource));
		jpaProperties.put("hibernate.ejb.interceptor", hibernateInterceptor());
		return factory.dataSource(dataSource).packages("com.qmatic.cloud.servicecontrollers").properties(jpaProperties).build();
	}*/

	@Bean
	public EmptyInterceptor hibernateInterceptor() {
		return new EmptyInterceptor() {

			@Override
			public boolean onSave(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
				if (entity instanceof TenantSupport) {
					// log.debug("[save] Updating the entity " + id + " with tenant information: " + TenantContext.getCurrentTenant());
					((TenantSupport) entity).setTenantId(TenantContext.getCurrentTenant());
				}
				return false;
			}

			@Override
			public void onDelete(Object entity, Serializable id, Object[] state, String[] propertyNames, Type[] types) {
				if (entity instanceof TenantSupport) {
					//log.debug("[delete] Updating the entity " + id + " with tenant information: " + TenantContext.getCurrentTenant());
					((TenantSupport) entity).setTenantId(TenantContext.getCurrentTenant());
				}
			}

			@Override
			public boolean onFlushDirty(Object entity, Serializable id, Object[] currentState, Object[] previousState, String[] propertyNames, Type[] types) {
				if (entity instanceof TenantSupport) {
					// log.debug("[flush-dirty] Updating the entity " + id + " with tenant information: " + TenantContext.getCurrentTenant());
					((TenantSupport) entity).setTenantId(TenantContext.getCurrentTenant());
				}
				return false;
			}

		};
	}
}
