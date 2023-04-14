import { Template } from "aws-cdk-lib/assertions";
import { NeptuneWithVpcStack } from "../../neptuneStack";
import { CustomStackProps } from "../../../bin/config";
import { getCustomStackPropsTests } from "./testHelper";
import { Stack } from "aws-cdk-lib";
import { NEPTUNE_STACK_NAME } from "../../../bin/neptuneStreamMain";

describe('Stack Step Function tests', () => {
    let stack: NeptuneWithVpcStack;
    let template: Template;
    const testStackProperties: CustomStackProps = getCustomStackPropsTests();
    console.log(` STACK PROPS: ${JSON.stringify(testStackProperties)}`);
  
    beforeEach(() => {
      stack = new NeptuneWithVpcStack(new Stack(), NEPTUNE_STACK_NAME, testStackProperties);
      template = Template.fromStack(stack);
    });

    it('should create a step function', () => {
        template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    });
});
