// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"

#include <igl/cotmatrix.h>
#include <Eigen/Dense>
#include <Eigen/Sparse>

#include <iostream>
#include <map>
#include <sstream>

// libigl should be a singleton.
class libiglInstance;
libiglInstance* libigl_singleton_ = NULL;

namespace {
  const char* const kHelloString = "hello";
  const char* const kReplyString = "hello from NaCl";
} // namespace

class libiglInstance : public pp::Instance {
  public:
  explicit libiglInstance(PP_Instance instance) :
      pp::Instance(instance),
      next_method_id_(1) {}
    virtual ~libiglInstance() {}
    virtual void HandleMessage(const pp::Var& var_message) {
      if (!var_message.is_string()) {
        return;
      }
      std::string message = var_message.AsString();
      pp::Var var_reply;
      if (message == kHelloString) {
      }
    }

  void RegisterMethod(const pp::Var& method_name) {
    
}

  private:
    int next_method_id_;
    
};

class libiglModule : public pp::Module {
 public:
  libiglModule() : pp::Module() {}
  virtual ~libiglModule() {}

  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    if (libigl_singleton_)
      return libigl_singleton_;
    return (libigl_singleton_ = new libiglInstance(instance));
  }
};

namespace pp {
Module* CreateModule() {
  return new libiglModule();
}
}  // namespace pp
