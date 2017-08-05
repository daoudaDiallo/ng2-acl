# Ng2 ACL

---

## About

Ng2 ACL _(Access Control List)_ is a service that allows you to protect/show content based on the current user's assigned role(s), and those role(s) permissions (abilities).  So, if the current user has a "moderator" role, and a moderator can "ban_users", then the current user can "ban_users".

Common uses include:

* Manipulate templates based on role/permissions
* Prevent routes that should not be viewable to user

### How secure is this?

A great analogy to ACL's in JavaScript would be form validation in JavaScript.  Just like form validation, ACL's in the browser can be tampered with.  However, just like form validation, ACL's are really useful and provide a better experience for the user and the developer.  Just remember, **any sensitive data or actions should require a server (or similar) as the final authority**.

##### Example Tampering Scenario

The current user has a role of "guest".  A guest is not able to "create_users".  However, this sneaky guest is clever enough to tamper with the system and give themselves that privilege. So, now that guest is at the "Create Users" page, and submits the form. The form data is sent to the server and the user is greeted with an "Access Denied: Unauthorized" message, because the server also checked to make sure that the user had the correct permissions.

Any sensitive data or actions should integrate a server check like this example.

---

## Basic Example

### Set Data

Setup the `AclService` in your app component's.

```ts
//app.component.ts

import { AclService } from 'ng2-acl/dist';

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app'
})
export class App {

  aclData = {};

  constructor(private aclService: AclService) {}

  ngOnInit() {
      // Set the ACL data. Normally, you'd fetch this from an API or something.
      // The data should have the roles as the property names,
      // with arrays listing their permissions as their value.
      this.aclData = {
          guest: ['login'],
          member: ['logout', 'view_content'],
          admin: ['logout', 'view_content', 'manage_content']
      }
      this.aclService.setAbilities(aclData);
          
      // Attach the member role to the current user
      this.aclService.attachRole('member');
  }

}

```

### Protect a route

If the current user tries to go to the `/manage` route, they will be redirected because the current user is a `member`, and `manage_content` is not one of a member role's abilities.

However, when the user goes to `/content`, route will work as normal, since the user has permission.  If the user was not a `member`, but a `guest`, then they would not be able to see the `content` route either, based on the data we set above.

```ts
//demo/demo.routing.ts
import { Routes } from '@angular/router';
import { DemoComponent } from './demo.component';
import { AclDemoResolver } from './demo.resolve';

// noinspection TypeScriptValidateTypes
const routes: Routes = [
  {
    path: '',
    component: DemoComponent,
    resolve: { route: AclDemoResolver, state: AclDemoResolver },
  },
];

//demo/demo.resolve.ts
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { AclService } from 'ng2-acl';
import { AclRedirection } from './app.redirection';

@Injectable()
export class AclDemoResolver implements Resolve<any> {
  constructor(
    private aclService: AclService, private router: Router, private aclRedirection: AclRedirection,
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    if (this.aclService.can('manage_content')) {
      // Has proper permissions
      return Observable.of(true);
    } else {
      // Does not have permission
      this.aclRedirection.redirectTo('Unauthorized');
    }
  }
}

//app.redirection.ts
//aclRedirection Service
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class AclRedirection {
  constructor(
       private router: Router,
  ) {}

  redirectTo(type: string) {
    if (type === 'Unauthorized') {
      this.router.navigate(['/']);
    }
  }
  
}

//app.module.ts
import { AclService } from 'ng2-acl';
import { AclDemoResolver } from './demo/demo.resolve';
import { App } from './app.component';
import { AclRedirection } from './app.redirection';
......
@NgModule({
  bootstrap: [App],
  declarations: [
    App,
  ],
  ......
  imports: [
  ......
  ],
  providers: [
    AclService,
    AclRedirection,
    AclDemoResolver,
  ],
  .....
})

export class AppModule {
}


```

### Manipulate a Template

The edit link in the template below will not show, because the current user is a `member`, and `manage_content` is not one of a member role's abilities.

###### Component

```ts
import { AclService } from 'ng2-acl/dist';

/*
 * Demo Component
 */
@Component({
  selector: 'demo',
  templateUrl: 'demo.html'
})
export class Demo {

  can = '';

  constructor(private aclService: AclService) {}

  ngOnInit() {
      this.can = this.aclService.can;
  }

}

```

###### Template

```html
<!--demo.html-->
<a *ngIf="can('manage_content')">Edit</a>
```

---

## Install

Install with `npm`:

```shell
npm install ng2-acl
```

---

## Documentation

#### Config Options

| Property | Default | Description |
| -------- | ------- | ----------- |
| `storage` | `"sessionStorage"` | `"sessionStorage"`, `"localStorage"`, `false`. Where you want to persist your ACL data. If you would prefer not to use web storage, then you can pass a value of `false`, and data will be reset on next page refresh _(next time the Angular app has to bootstrap)_ |
| `storageKey` | `"AclService"` | The key that will be used when storing data in web storage |

### Public Methods

#### `this.aclService.resume()`

Restore data from web storage.

###### Returns

**boolean** - true if web storage existed, false if it didn't

###### Example Usage

```ts
import { AclService } from 'ng2-acl/dist';

/*
 * Demo Component
 */
@Component({
  selector: 'demo',
  templateUrl: 'demo.html'
})
export class Demo {

  can = '';

  constructor(private aclService: AclService) {}

  ngOnInit() {
      if (!this.aclService.resume()) {
          // Web storage record did not exist, we'll have to build it from scratch
          
          // Get the user role, and add it to AclService
          var userRole = fetchUserRoleFromSomewhere();
          this.aclService.addRole(userRole);
          
          // Get ACL data, and add it to AclService
          var aclData = fetchAclFromSomewhere();
          this.aclService.setAbilities(aclData);
       }
  }

}


#### `this.aclService.flushStorage()`

Remove all data from web storage.

#### `this.aclService.attachRole(role)`

Attach a role to the current user. A user can have multiple roles.

###### Parameters

| Param | Type | Example | Details |
| ----- | ---- | ------- | ------- |
| `role` | string | `"admin"` | The role label |

#### `this.aclService.detachRole(role)`

Remove a role from the current user

###### Parameters

| Param | Type | Example | Details |
| ----- | ---- | ------- | ------- |
| `role` | string | `"admin"` | The role label |

#### `AclService.flushRoles()`

Remove all roles from current user

#### `this.aclService.getRoles()`

Get all of the roles attached to the user

###### Returns

**array**

#### `this.aclService.hasRole(role)`

Check if the current user has role(s) attached. If an array is given, all roles must be attached. To check if any roles in an array are attached see the `hasAnyRole()` method.

###### Parameters

| Param | Type | Example | Details |
| ----- | ---- | ------- | ------- |
| `role` | string/array | `"admin"` | The role label, or an array of role labels |

###### Returns

**boolean**

#### `this.aclService.hasAnyRole(roles)`

Check if the current user has any of the given roles attached. To check if all roles in an array are attached see the `hasRole()` method.

###### Parameters

| Param | Type | Example | Details |
| ----- | ---- | ------- | ------- |
| `roles` | array | `["admin","user"]` | Array of role labels |

###### Returns

**boolean**

#### `this.aclService.setAbilities(abilities)`

Set the abilities object (overwriting previous abilities).

###### Parameters

| Param | Type | Details |
| ----- | ---- | ------- |
| `abilities` | object | Each property on the abilities object should be a role. Each role should have a value of an array. The array should contain a list of all of the role's abilities. |

###### Example

```ts
this.abilities = {
  guest: ['login'],
  user: ['logout', 'view_content'],
  admin: ['logout', 'view_content', 'manage_content']
}
this.aclService.setAbilities(abilities);
```

#### `this.aclService.addAbility(role, ability)`

Add an ability to a role

###### Parameters

| Param | Type | Example | Details |
| ----- | ---- | ------- | ------- |
| `role` | string | `"admin"` | The role label |
| `ability` | string | `"create_users"` | The ability/permission label |

#### `this.aclService.can(ability)`

Does current user have permission to do the given ability?

###### Returns

**boolean**

###### Example

```ts
// Setup some abilities
this.aclService.addAbility('moderator', 'ban_users');
this.aclService.addAbility('admin', 'create_users');

// Add moderator role to the current user
this.aclService.attachRole('moderator');

// Check if the current user has these permissions
this.aclService.can('ban_users'); // returns true
this.aclService.can('create_users'); // returns false
```


---

## License

The MIT License

Ng2 ACL
Copyright (c) 2017 Daouda Diallo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
