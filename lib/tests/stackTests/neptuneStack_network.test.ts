import {Template} from 'aws-cdk-lib/assertions';
import {NeptuneWithVpcStack} from '../../neptuneStack';
import {CustomStackProps} from '../../../bin/config';
import {getCustomStackPropsTests} from './testHelper';
import {Stack} from 'aws-cdk-lib';
import {NEPTUNE_STACK_NAME} from '../../../bin/neptuneStreamMain';

describe('Stack network tests', () => {
  let stack: NeptuneWithVpcStack;
  let template: Template;
  const testStackProperties: CustomStackProps = getCustomStackPropsTests();
  console.log(` STACK PROPS: ${JSON.stringify(testStackProperties)}`);

  beforeEach(() => {
    stack = new NeptuneWithVpcStack(new Stack(), NEPTUNE_STACK_NAME, testStackProperties);
    template = Template.fromStack(stack);
  });

  it('should create 4 Subnet Route Table Associations', () => {
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4);

    const subnetRouteTableAssociations = template.findResources('AWS::EC2::SubnetRouteTableAssociation', {});
    const associationsArray = Object.values(subnetRouteTableAssociations);
    const filteredAssociations = associationsArray.filter(resource => {
      const subnetId = resource.Properties.SubnetId.Ref;
      const routeTableId = resource.Properties.RouteTableId.Ref;
      const subnetRegex = /^NeptuneVPC(?:db|dmz)Subnet\dSubnet\w{8}$/;
      const routeTableRegex = /^NeptuneVPC(?:db|dmz)Subnet\dRouteTable\w{8}$/;

      return subnetRegex.test(subnetId) && routeTableRegex.test(routeTableId);
    });

    expect(filteredAssociations.length).toBe(4);
  });

  it('should create 2 private and 2 public networks', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4);

    const subnets = template.findResources('AWS::EC2::Subnet', {});
    const subnetsArray = Object.values(subnets);

    const privateSubnets = subnetsArray.filter(resource =>
      resource.Properties.Tags.some(
        (tag: {Key: string; Value: string}) => tag.Key === 'NetworkType' && tag.Value === 'Private',
      ),
    );

    const publicSubnets = subnetsArray.filter(resource =>
      resource.Properties.Tags.some(
        (tag: {Key: string; Value: string}) => tag.Key === 'NetworkType' && tag.Value === 'Public',
      ),
    );

    expect(privateSubnets.length).toBe(2);
    expect(publicSubnets.length).toBe(2);
  });

  it('should create an Internet Gateway with proper tags', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {
      Tags: [
        {Key: 'CreatedBy', Value: 'CDK'},
        {Key: 'Name', Value: 'Default/Neptune-With-VPC-Stack/NeptuneVPC'},
        {Key: 'Owner', Value: 'CDK'},
        {Key: 'Purpose', Value: 'Neptune Cluster Stream demo'},
      ],
    });
  });

  it('should create 4 Route Tables', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 4);
  });

  it('should create Route Tables with proper properties', () => {
    const routeTables = template.findResources('AWS::EC2::RouteTable', {});

    Object.values(routeTables).forEach((routeTable: any) => {
      expect(routeTable.Properties.VpcId.Ref).toMatch(/NeptuneVPC[A-Za-z0-9]{8}/);

      const expectedTags = [
        {Key: 'CreatedBy', Value: 'CDK'},
        {
          Key: 'Name',
          Value: expect.stringMatching(/^Default\/Neptune-With-VPC-Stack\/NeptuneVPC\/(?:db|dmz)Subnet\d{1,}$/),
        },
        {Key: 'NetworkType', Value: expect.stringMatching(/^(Private|Public)$/)},
        {Key: 'Owner', Value: 'CDK'},
        {Key: 'Purpose', Value: 'Neptune Cluster Stream demo'},
      ];

      expect(routeTable.Properties.Tags).toEqual(expect.arrayContaining(expectedTags));
    });
  });

  it('should create 2 Routes', () => {
    template.resourceCountIs('AWS::EC2::Route', 2);
  });

  it('should create Routes with proper properties', () => {
    const routes = template.findResources('AWS::EC2::Route', {});

    Object.values(routes).forEach((route: any) => {
      expect(route.Properties.RouteTableId.Ref).toMatch(/^NeptuneVPC(?:db|dmz)Subnet\dRouteTable\w{8}$/);
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId.Ref).toMatch(/^NeptuneVPCIGW\w{8}$/);
    });
  });
});
